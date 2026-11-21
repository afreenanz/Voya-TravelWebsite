"""Tool C — Budget calculator. All arithmetic happens here, never in the LLM.

The AI may *estimate* how much each category costs; this tool turns those
estimates into totals, remaining budget, cost per day and per person using
Decimal arithmetic, and formats amounts the way the UI already expects.
"""
import re
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

CATEGORIES = {  # same keys the existing itinerary UI renders
    "flights": "Flights",
    "accommodation": "Accommodation",
    "food": "Food",
    "activities": "Activities",
    "local_transport": "Local transport",
    "misc": "Miscellaneous",
}
SYMBOLS = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "AUD": "A$", "SGD": "S$", "AED": "AED "}
_SYMBOL_TO_CODE = {"₹": "INR", "€": "EUR", "£": "GBP", "¥": "JPY", "$": "USD"}
_WORD_TO_CODE = {"rs": "INR", "inr": "INR", "rupee": "INR", "usd": "USD", "dollar": "USD", "eur": "EUR",
                 "euro": "EUR", "gbp": "GBP", "pound": "GBP", "jpy": "JPY", "yen": "JPY", "aud": "AUD",
                 "sgd": "SGD", "aed": "AED", "dirham": "AED"}
MULTIPLIERS = {"k": 1_000, "thousand": 1_000, "lakh": 100_000, "lakhs": 100_000, "lac": 100_000,
               "lacs": 100_000, "crore": 10_000_000, "m": 1_000_000, "million": 1_000_000}


class BudgetError(ValueError):
    pass


def _whole(x):
    return x.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def parse_amount(text, default_currency="INR"):
    """'₹1,00,000' / '$2,500' / '60k' / '1.5 lakh' / 2500 → (Decimal amount, currency code).
    Raises BudgetError if no number is found."""
    if isinstance(text, (int, float, Decimal)) and not isinstance(text, bool):
        amount = Decimal(str(text))
        if amount < 0:
            raise BudgetError("Amounts can't be negative.")
        return amount, default_currency
    s = str(text or "").strip().lower()
    currency = default_currency
    if "a$" in s:
        currency = "AUD"
    elif "s$" in s:
        currency = "SGD"
    else:
        currency = next((code for sym, code in _SYMBOL_TO_CODE.items() if sym in s), currency)
    currency = next((code for word, code in _WORD_TO_CODE.items() if re.search(rf"\b{word}s?\b", s)), currency)
    if re.search(r"-\s*\D{0,3}\d", s):
        raise BudgetError("Amounts can't be negative.")
    m = re.search(r"(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|crore|m|million)?\b", s)
    if not m:
        raise BudgetError("Couldn't find an amount.")
    number = m.group(1)
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", number):  # "€1.200" = 1,200 in European notation
        number = number.replace(".", "")
    try:
        amount = Decimal(number.replace(",", ""))
    except InvalidOperation:
        raise BudgetError("Couldn't read that amount.")
    if m.group(2):
        amount *= MULTIPLIERS[m.group(2)]
    return amount, currency


def format_amount(amount, currency="INR"):
    """Decimal → '₹1,00,000' (Indian grouping for INR) or '$2,500'."""
    n = int(_whole(Decimal(amount)))
    sign, n = ("-" if n < 0 else ""), abs(n)
    digits = str(n)
    if currency == "INR" and len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        head = ",".join([head[max(0, i - 2):i] for i in range(len(head), 0, -2)][::-1])
        grouped = f"{head},{tail}"
    else:
        grouped = f"{n:,}"
    return f"{sign}{SYMBOLS.get(currency, currency + ' ')}{grouped}"


def calculate_budget(estimates, *, total_budget=None, days=1, travelers=1, currency="INR", labels=None):
    """estimates: {category: amount} (AI estimates for the WHOLE trip, all travellers).
    total_budget: the user's budget (number or text like '₹60,000') or None.
    → {"status": "ok"|"error", categories, total, budget, remaining, over_budget, per_day, ...}"""
    try:
        if not isinstance(estimates, dict) or not estimates:
            raise BudgetError("No cost estimates to add up.")
        unknown = set(estimates) - set(CATEGORIES)
        if unknown:
            raise BudgetError(f"Unknown cost category: {sorted(unknown)[0]}.")
        days, travelers = int(days), int(travelers)
        if days < 1 or travelers < 1:
            raise BudgetError("Days and travellers must be at least 1.")
        amounts = {}
        for key in CATEGORIES:
            if estimates.get(key) in (None, ""):
                continue
            value, _ = parse_amount(estimates[key], currency)
            amounts[key] = _whole(value)
        budget = None
        if total_budget not in (None, ""):
            budget, parsed_currency = parse_amount(total_budget, currency)
            budget = _whole(budget)
            currency = parsed_currency
    except (BudgetError, TypeError, ValueError) as e:
        return {"status": "error", "message": str(e)}

    total = sum(amounts.values(), Decimal(0))
    cats = [{
        "key": key, "label": {**CATEGORIES, **(labels or {})}[key], "amount": int(v), "formatted": format_amount(v, currency),
        "share_pct": float((v / total * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)) if total else 0.0,
    } for key, v in amounts.items()]
    result = {
        "status": "ok",
        "currency": currency,
        "categories": cats,
        "total": int(total),
        "total_formatted": format_amount(total, currency),
        "days": days,
        "travelers": travelers,
        "per_day": int(_whole(total / days)),
        "per_person": int(_whole(total / travelers)),
        "per_person_per_day": int(_whole(total / days / travelers)),
        "note": "Category amounts are AI estimates; totals and remaining budget are calculated by Voya.",
    }
    if budget is not None:
        remaining = budget - total
        result.update({
            "budget": int(budget),
            "budget_formatted": format_amount(budget, currency),
            "remaining": int(remaining),
            "remaining_formatted": format_amount(remaining, currency),
            "over_budget": remaining < 0,
            "used_pct": float((total / budget * 100).quantize(Decimal("0.1"))) if budget else None,
        })
    return result


def to_cost_breakdown(budget_result, notes=None):
    """Budget result → the cost_breakdown shape the existing itinerary UI renders."""
    notes = notes or {}
    out = {"total": budget_result["total_formatted"]}
    for c in budget_result.get("categories", []):
        out[c["key"]] = {"amount": c["formatted"], "note": (notes.get(c["key"]) or "")[:200]}
    return out
