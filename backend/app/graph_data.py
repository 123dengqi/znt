"""人格心理学知识图谱预置数据。

节点类别（category）：
  0 流派 (school)
  1 人物 (person)
  2 理论/概念 (concept)
  3 测评工具 (assessment)
  4 案例主题 (case)

边的关系字段 rel：
  belongs_to / proposed / opposed / applies_to / measures / extends / related_to
"""
from __future__ import annotations

from typing import Any


CATEGORIES: list[dict[str, str]] = [
    {"name": "流派"},
    {"name": "人物"},
    {"name": "理论/概念"},
    {"name": "测评工具"},
    {"name": "案例主题"},
]

# (id, name, category_index, brief)
NODES: list[tuple[str, str, int, str]] = [
    # 流派 0
    ("s_psy", "精神分析流派", 0, "强调潜意识、冲突、防御机制与早期经验。"),
    ("s_hum", "人本主义流派", 0, "强调自我实现、自我概念、积极关注。"),
    ("s_trait", "特质流派", 0, "用相对稳定的人格维度刻画个体差异。"),
    ("s_sl", "社会学习/认知-社会流派", 0, "观察学习、自我效能、三元交互。"),
    ("s_cog", "认知取向", 0, "图式、自动思维、认知重评。"),
    ("s_beh", "行为主义流派", 0, "条件作用、强化、塑造。"),

    # 人物 1
    ("p_freud", "弗洛伊德", 1, "精神分析创始人。"),
    ("p_jung", "荣格", 1, "分析心理学，集体潜意识与原型。"),
    ("p_adler", "阿德勒", 1, "个体心理学，自卑与追求优越。"),
    ("p_horney", "霍尼", 1, "新精神分析，神经症人格。"),
    ("p_erikson", "埃里克森", 1, "心理社会发展八阶段。"),
    ("p_rogers", "罗杰斯", 1, "个人中心治疗、自我概念。"),
    ("p_maslow", "马斯洛", 1, "需要层次、自我实现。"),
    ("p_allport", "奥尔波特", 1, "特质理论：枢纽/中心/次要特质。"),
    ("p_cattell", "卡特尔", 1, "16 人格因素与因素分析。"),
    ("p_eysenck", "艾森克", 1, "PEN 模型（外向/神经质/精神质）。"),
    ("p_bandura", "班杜拉", 1, "社会学习理论、自我效能。"),
    ("p_rotter", "罗特", 1, "社会学习、控制点。"),
    ("p_mischel", "米歇尔", 1, "认知-情感人格系统(CAPS)，情境主义。"),
    ("p_skinner", "斯金纳", 1, "操作性条件作用。"),
    ("p_pavlov", "巴甫洛夫", 1, "经典条件作用。"),
    ("p_beck", "贝克", 1, "认知治疗与负性自动思维。"),

    # 理论/概念 2
    ("c_id_ego_superego", "本我/自我/超我", 2, "人格三结构。"),
    ("c_unconscious", "潜意识", 2, "受抑或难以觉察的心理内容。"),
    ("c_defense", "防御机制", 2, "压抑、否认、合理化等。"),
    ("c_psychosexual", "性心理发展阶段", 2, "口唇/肛门/性器/潜伏/生殖。"),
    ("c_archetype", "原型与集体潜意识", 2, "荣格的核心概念。"),
    ("c_inferiority", "自卑感与追求优越", 2, "阿德勒的核心动力假设。"),
    ("c_psychosocial", "心理社会发展阶段", 2, "埃里克森的八阶段。"),
    ("c_self_concept", "自我概念", 2, "对自身的整体看法与体验。"),
    ("c_unconditional", "无条件积极关注", 2, "罗杰斯的核心治疗态度之一。"),
    ("c_value_cond", "价值条件", 2, "由重要他人施加的接纳前提。"),
    ("c_self_actual", "自我实现", 2, "成为自己潜能所是的过程。"),
    ("c_hierarchy", "需要层次", 2, "生理/安全/归属/尊重/自我实现。"),
    ("c_big5", "大五人格(OCEAN)", 2, "开放/尽责/外向/宜人/神经质。"),
    ("c_16pf", "16 人格因素", 2, "卡特尔基于因素分析得到。"),
    ("c_pen", "PEN 模型", 2, "外向性/神经质/精神质。"),
    ("c_observational", "观察学习", 2, "通过榜样与替代经验学习。"),
    ("c_self_efficacy", "自我效能", 2, "对完成特定任务能力的信念。"),
    ("c_triadic", "三元交互决定论", 2, "个体-行为-环境互相影响。"),
    ("c_loc", "控制点", 2, "结果归因于内部或外部的倾向。"),
    ("c_caps", "认知-情感人格系统", 2, "米歇尔强调情境敏感性。"),
    ("c_schema", "图式与自动思维", 2, "认知治疗的核心结构。"),
    ("c_reappraisal", "认知重评", 2, "情绪调节的认知策略。"),
    ("c_classical", "经典条件作用", 2, "巴甫洛夫的反射学习。"),
    ("c_operant", "操作性条件作用", 2, "斯金纳的强化与惩罚。"),

    # 测评工具 3
    ("a_mmpi", "MMPI", 3, "明尼苏达多相人格测验，自陈量表。"),
    ("a_neopi", "NEO-PI-R", 3, "测量大五及细分面。"),
    ("a_16pf", "16PF", 3, "卡特尔编制的自陈量表。"),
    ("a_rorschach", "罗夏墨迹", 3, "投射性人格测验。"),
    ("a_tat", "TAT 主题统觉测验", 3, "投射性测验。"),

    # 案例主题 4
    ("k_procras", "拖延与自我效能", 4, "课堂讨论常见情境。"),
    ("k_perfect", "完美主义与价值条件", 4, "人本/认知视角。"),
    ("k_dream", "考试梦境与潜在焦虑", 4, "精神分析教学化讨论。"),
    ("k_dorm", "宿舍人际冲突", 4, "可用大五讨论。"),
    ("k_anxiety", "考试焦虑与认知重评", 4, "认知取向情绪调节。"),
    ("k_meaning", "意义感与自我实现", 4, "人本主义生涯讨论。"),
]

EDGES: list[tuple[str, str, str]] = [
    # 人物-流派
    ("p_freud", "s_psy", "belongs_to"),
    ("p_jung", "s_psy", "belongs_to"),
    ("p_adler", "s_psy", "belongs_to"),
    ("p_horney", "s_psy", "belongs_to"),
    ("p_erikson", "s_psy", "belongs_to"),
    ("p_rogers", "s_hum", "belongs_to"),
    ("p_maslow", "s_hum", "belongs_to"),
    ("p_allport", "s_trait", "belongs_to"),
    ("p_cattell", "s_trait", "belongs_to"),
    ("p_eysenck", "s_trait", "belongs_to"),
    ("p_bandura", "s_sl", "belongs_to"),
    ("p_rotter", "s_sl", "belongs_to"),
    ("p_mischel", "s_sl", "belongs_to"),
    ("p_skinner", "s_beh", "belongs_to"),
    ("p_pavlov", "s_beh", "belongs_to"),
    ("p_beck", "s_cog", "belongs_to"),

    # 人物-提出概念
    ("p_freud", "c_id_ego_superego", "proposed"),
    ("p_freud", "c_unconscious", "proposed"),
    ("p_freud", "c_defense", "proposed"),
    ("p_freud", "c_psychosexual", "proposed"),
    ("p_jung", "c_archetype", "proposed"),
    ("p_adler", "c_inferiority", "proposed"),
    ("p_erikson", "c_psychosocial", "proposed"),
    ("p_rogers", "c_self_concept", "proposed"),
    ("p_rogers", "c_unconditional", "proposed"),
    ("p_rogers", "c_value_cond", "proposed"),
    ("p_maslow", "c_hierarchy", "proposed"),
    ("p_maslow", "c_self_actual", "proposed"),
    ("p_cattell", "c_16pf", "proposed"),
    ("p_eysenck", "c_pen", "proposed"),
    ("p_bandura", "c_observational", "proposed"),
    ("p_bandura", "c_self_efficacy", "proposed"),
    ("p_bandura", "c_triadic", "proposed"),
    ("p_rotter", "c_loc", "proposed"),
    ("p_mischel", "c_caps", "proposed"),
    ("p_beck", "c_schema", "proposed"),
    ("p_pavlov", "c_classical", "proposed"),
    ("p_skinner", "c_operant", "proposed"),

    # 概念-流派
    ("c_id_ego_superego", "s_psy", "belongs_to"),
    ("c_unconscious", "s_psy", "belongs_to"),
    ("c_defense", "s_psy", "belongs_to"),
    ("c_psychosexual", "s_psy", "belongs_to"),
    ("c_archetype", "s_psy", "belongs_to"),
    ("c_inferiority", "s_psy", "belongs_to"),
    ("c_psychosocial", "s_psy", "belongs_to"),
    ("c_self_concept", "s_hum", "belongs_to"),
    ("c_unconditional", "s_hum", "belongs_to"),
    ("c_value_cond", "s_hum", "belongs_to"),
    ("c_self_actual", "s_hum", "belongs_to"),
    ("c_hierarchy", "s_hum", "belongs_to"),
    ("c_big5", "s_trait", "belongs_to"),
    ("c_16pf", "s_trait", "belongs_to"),
    ("c_pen", "s_trait", "belongs_to"),
    ("c_observational", "s_sl", "belongs_to"),
    ("c_self_efficacy", "s_sl", "belongs_to"),
    ("c_triadic", "s_sl", "belongs_to"),
    ("c_loc", "s_sl", "belongs_to"),
    ("c_caps", "s_sl", "belongs_to"),
    ("c_schema", "s_cog", "belongs_to"),
    ("c_reappraisal", "s_cog", "belongs_to"),
    ("c_classical", "s_beh", "belongs_to"),
    ("c_operant", "s_beh", "belongs_to"),

    # 概念间关系
    ("c_self_concept", "c_value_cond", "related_to"),
    ("c_self_concept", "c_unconditional", "related_to"),
    ("c_hierarchy", "c_self_actual", "related_to"),
    ("c_observational", "c_self_efficacy", "related_to"),
    ("c_self_efficacy", "c_loc", "related_to"),
    ("c_schema", "c_reappraisal", "related_to"),
    ("c_classical", "c_operant", "related_to"),

    # 测评-概念
    ("a_neopi", "c_big5", "measures"),
    ("a_16pf", "c_16pf", "measures"),
    ("a_mmpi", "s_trait", "applies_to"),
    ("a_rorschach", "s_psy", "applies_to"),
    ("a_tat", "s_psy", "applies_to"),

    # 案例-流派/概念
    ("k_procras", "c_self_efficacy", "applies_to"),
    ("k_procras", "c_loc", "applies_to"),
    ("k_perfect", "c_value_cond", "applies_to"),
    ("k_perfect", "c_schema", "applies_to"),
    ("k_dream", "c_unconscious", "applies_to"),
    ("k_dream", "c_defense", "applies_to"),
    ("k_dorm", "c_big5", "applies_to"),
    ("k_anxiety", "c_schema", "applies_to"),
    ("k_anxiety", "c_reappraisal", "applies_to"),
    ("k_meaning", "c_self_actual", "applies_to"),
    ("k_meaning", "c_hierarchy", "applies_to"),

    # 一些"对立 / 扩展"的教学性关系
    ("s_hum", "s_psy", "opposed"),
    ("s_beh", "s_cog", "extends"),
    ("s_sl", "s_beh", "extends"),
]


def get_graph() -> dict[str, Any]:
    nodes = [
        {"id": nid, "name": name, "category": cat, "brief": brief}
        for (nid, name, cat, brief) in NODES
    ]
    links = [{"source": s, "target": t, "rel": rel} for (s, t, rel) in EDGES]
    return {"categories": CATEGORIES, "nodes": nodes, "links": links}


def find_node(node_id: str) -> dict[str, Any] | None:
    for nid, name, cat, brief in NODES:
        if nid == node_id:
            return {"id": nid, "name": name, "category": cat, "brief": brief}
    return None


def neighbors(node_id: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for s, t, rel in EDGES:
        other = None
        if s == node_id:
            other = t
        elif t == node_id:
            other = s
        if not other or other in seen:
            continue
        n = find_node(other)
        if n:
            n = {**n, "rel": rel}
            out.append(n)
            seen.add(other)
    return out
