"""预置课程思政元素 + 知识点映射 + 一条示例任务。"""
from __future__ import annotations

from app.db import Base, SessionLocal, engine
from app.models import IdeologyElement, IdeologyTeachingTask, KnowledgeIdeologyMapping, User

ELEMENTS = [
    ("科学精神", "学科精神", "尊重事实、追求证据，避免主观臆断；保持开放与可证伪的科学态度。",
     "全部章节", "对各流派的理论贡献与局限做客观评述"),
    ("学术伦理", "职业伦理", "在研究、测评、教学中坚持诚信、原创与责任，反对学术不端。",
     "人格测评 / 人格适应与异常", "数据收集与结果使用中的合规与责任"),
    ("心理测量伦理", "职业伦理", "测评的目的、用途、解释边界与保密原则；测评结果不能被滥用。",
     "人格测评", "MMPI / 大五人格测评结果的教学化使用"),
    ("尊重个体差异", "人文关怀", "看见个体在特质、文化、经历上的差异，避免标签化。",
     "人格特质理论 / 人格发展", "大五人格差异的教学化讨论"),
    ("人文关怀", "人文关怀", "对学生与来访者的处境保持尊重与共情，体现教育温度。",
     "人格适应与异常", "对学习困难学生的尊重式反馈"),
    ("社会责任", "公民意识", "把专业能力放在国家与社会需要中思考，承担育人与社会贡献。",
     "人格发展 / 人格适应与异常", "校园心理健康支持网络"),
    ("文化自信", "价值认同", "在借鉴域外理论时，关注本土文化与汉语社会的人格表达。",
     "人格动力理论 / 人格发展", "传统文化中的'修身'与人本主义对照"),
    ("生命教育", "价值认同", "尊重生命、关爱自我与他人，识别危机迹象并引导专业资源。",
     "人格适应与异常", "对自我伤害类话题的安全引导"),
    ("心理健康意识", "学科精神", "把心理健康教育与人格发展教育自然融合，倡导早期识别与求助。",
     "人格适应与异常 / 人格发展", "考试焦虑与认知重评"),
    ("职业使命感", "公民意识", "对心理学/教育职业的责任感与边界感，理解'非诊断'的教学定位。",
     "全部章节", "教学化身的角色定位与教学边界"),
    ("成长观与责任意识", "价值认同", "把人格视作可发展的、可承担责任的，反对宿命化与标签化。",
     "人格发展", "埃里克森八阶段与成长任务"),
    ("辩证科学批判", "学科精神", "对单一理论或单一测评的局限保持批判性思维。",
     "人格动力理论 / 人格特质理论", "精神分析理论的贡献与局限"),
]

MAPPINGS = [
    {
        "chapter": "人格特质理论",
        "knowledge_point": "大五人格(OCEAN)",
        "element_name": "尊重个体差异",
        "integration_method": "引导学生理解人格特质的相对稳定+情境调节，避免用单一标签下结论。",
        "teaching_scenario": "课中讨论",
        "evaluation_indicator": "能否在 1 分钟内用大五维度描述差异而不评价好坏",
    },
    {
        "chapter": "人格测评",
        "knowledge_point": "MMPI / 大五人格测评",
        "element_name": "心理测量伦理",
        "integration_method": "把测评定位为'对话起点'而非'诊断终点'，强调知情同意、结果保密与解释边界。",
        "teaching_scenario": "课中讨论",
        "evaluation_indicator": "能否复述测评伦理的三条核心要求",
    },
    {
        "chapter": "人格动力理论",
        "knowledge_point": "精神分析理论",
        "element_name": "辩证科学批判",
        "integration_method": "区分精神分析的历史贡献与可证伪性局限，引导用辩证科学态度对待经典理论。",
        "teaching_scenario": "课前预习",
        "evaluation_indicator": "能列出 1 项贡献与 1 项局限",
    },
    {
        "chapter": "人格发展",
        "knowledge_point": "埃里克森心理社会发展阶段",
        "element_name": "成长观与责任意识",
        "integration_method": "把发展任务看作可承担、可练习的，鼓励学生在校园情境中识别自己的发展任务。",
        "teaching_scenario": "课后反思",
        "evaluation_indicator": "能写出本阶段一个可操作的成长任务",
    },
    {
        "chapter": "人格适应与异常",
        "knowledge_point": "焦虑与认知重评",
        "element_name": "心理健康意识",
        "integration_method": "把认知重评作为日常可练习的策略，并明确专业支持的转介路径。",
        "teaching_scenario": "课中讨论",
        "evaluation_indicator": "能复述一条认知重评的练习路径",
    },
    {
        "chapter": "人格适应与异常",
        "knowledge_point": "心理危机识别与转介",
        "element_name": "生命教育",
        "integration_method": "在不下诊断的前提下，强调对危机迹象的尊重式识别与专业资源的及时转介。",
        "teaching_scenario": "课后反思",
        "evaluation_indicator": "能说出 2 条危机识别要点与 1 条转介路径",
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.username == "teacher").first()
        uid = teacher.id if teacher else None

        # 元素
        added_e = 0
        for name, cat, desc, chs, ex in ELEMENTS:
            if db.query(IdeologyElement).filter(IdeologyElement.name == name).first():
                continue
            db.add(IdeologyElement(
                name=name, category=cat, description=desc,
                suitable_chapters=chs, example_cases=ex,
                created_by=uid,
            ))
            added_e += 1
        db.flush()

        # 映射
        added_m = 0
        for m in MAPPINGS:
            e = db.query(IdeologyElement).filter(IdeologyElement.name == m["element_name"]).first()
            if not e:
                continue
            exists = db.query(KnowledgeIdeologyMapping).filter(
                KnowledgeIdeologyMapping.chapter == m["chapter"],
                KnowledgeIdeologyMapping.knowledge_point == m["knowledge_point"],
                KnowledgeIdeologyMapping.ideology_element_id == e.id,
            ).first()
            if exists:
                continue
            db.add(KnowledgeIdeologyMapping(
                chapter=m["chapter"],
                knowledge_point=m["knowledge_point"],
                ideology_element_id=e.id,
                integration_method=m["integration_method"],
                teaching_scenario=m["teaching_scenario"],
                evaluation_indicator=m["evaluation_indicator"],
                created_by=uid,
            ))
            added_m += 1

        # 一条示例任务（让学生端首启动也能看到）
        if not db.query(IdeologyTeachingTask).filter(IdeologyTeachingTask.title.like("【示例】%")).first():
            db.add(IdeologyTeachingTask(
                title="【示例】课后反思：大五人格与个体差异",
                chapter="人格特质理论",
                knowledge_point="大五人格(OCEAN)",
                ideology_elements="尊重个体差异",
                task_type="post_reflection",
                task_content=(
                    "请结合本章关于大五人格(OCEAN)的内容，谈谈：在你身边的同学群体中，"
                    "你观察到哪些跨情境相对稳定的特质差异？你如何在不贴标签的前提下尊重这些差异？\n"
                    "提示：可结合 1-2 个具体情境（自习室、社团、宿舍）描述。"
                ),
                target_students="all",
                status="published",
                lesson_plan={},
                created_by=uid,
            ))

        db.commit()
        print(f"已写入思政元素 {added_e} 条，映射 {added_m} 条")
    finally:
        db.close()


if __name__ == "__main__":
    main()
