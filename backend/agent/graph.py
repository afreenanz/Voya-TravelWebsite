"""LangGraph wiring for the Voya agent."""
from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from . import nodes
from .state import AgentState


@lru_cache(maxsize=1)
def build_graph():
    g = StateGraph(AgentState)
    g.add_node("load_context", nodes.load_context)
    g.add_node("understand", nodes.understand)
    g.add_node("decide", nodes.decide)
    g.add_node("execute_tools", nodes.execute_tools)
    g.add_node("respond", nodes.respond)
    g.add_node("persist", nodes.persist)

    g.add_edge(START, "load_context")
    g.add_edge("load_context", "understand")
    g.add_edge("understand", "decide")
    # Conditional routing: run tools, or go straight to a reply (clarifying question / plain answer / error).
    g.add_conditional_edges("decide", nodes.route_after_decide, {"execute_tools": "execute_tools", "respond": "respond"})
    g.add_edge("execute_tools", "respond")
    g.add_edge("respond", "persist")
    g.add_edge("persist", END)
    return g.compile()
