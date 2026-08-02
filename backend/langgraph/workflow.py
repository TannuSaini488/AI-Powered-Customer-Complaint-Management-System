from langgraph.graph import END, START, StateGraph

from langgraph.nodes import (
    capa_node,
    complaint_understanding_node,
    completeness_node,
    document_parser_node,
    duplicate_node,
    extraction_node,
    formatter_node,
    input_node,
    risk_node,
    root_cause_node,
    summary_node,
    text_cleaner_node,
)
from langgraph.state import ComplaintState
from schemas.complaint import ComplaintAnalyzeRequest, ComplaintAnalysisResponse


def build_complaint_graph():
    graph = StateGraph(ComplaintState)
    graph.add_node("InputNode", input_node)
    graph.add_node("DocumentParserNode", document_parser_node)
    graph.add_node("TextCleanerNode", text_cleaner_node)
    graph.add_node("ComplaintUnderstandingNode", complaint_understanding_node)
    graph.add_node("ExtractionNode", extraction_node)
    graph.add_node("SummaryNode", summary_node)
    graph.add_node("RiskNode", risk_node)
    graph.add_node("RootCauseNode", root_cause_node)
    graph.add_node("CAPANode", capa_node)
    graph.add_node("CompletenessNode", completeness_node)
    graph.add_node("DuplicateNode", duplicate_node)
    graph.add_node("FormatterNode", formatter_node)

    graph.add_edge(START, "InputNode")
    graph.add_edge("InputNode", "DocumentParserNode")
    graph.add_edge("DocumentParserNode", "TextCleanerNode")
    graph.add_edge("TextCleanerNode", "ComplaintUnderstandingNode")
    graph.add_edge("ComplaintUnderstandingNode", "ExtractionNode")
    graph.add_edge("ExtractionNode", "SummaryNode")
    graph.add_edge("SummaryNode", "RiskNode")
    graph.add_edge("RiskNode", "RootCauseNode")
    graph.add_edge("RootCauseNode", "CAPANode")
    graph.add_edge("CAPANode", "CompletenessNode")
    graph.add_edge("CompletenessNode", "DuplicateNode")
    graph.add_edge("DuplicateNode", "FormatterNode")
    graph.add_edge("FormatterNode", END)
    return graph.compile()


complaint_graph = build_complaint_graph()


def run_complaint_workflow(payload: ComplaintAnalyzeRequest) -> ComplaintAnalysisResponse:
    result = complaint_graph.invoke({"request": payload})
    final_response = result.get("final_response")
    if not isinstance(final_response, ComplaintAnalysisResponse):
        raise RuntimeError("Complaint graph did not return a final response.")
    return final_response
