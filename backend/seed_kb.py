"""初始化少量种子知识，便于无上传时即可演示问答与对比。"""
from __future__ import annotations

from app.db import Base, SessionLocal, engine
from app.models import Document, Chunk, User
from app.retrieval import tokenize


SEEDS = [
    {
        "title": "精神分析流派概述",
        "chapter": "人格动力理论",
        "school": "精神分析",
        "text": (
            "精神分析由弗洛伊德创立，强调潜意识、性心理发展阶段（口唇期-生殖期）以及本我、自我、超我的人格结构。"
            "防御机制（压抑、否认、投射、升华等）在自我面对冲突时起调节作用。"
            "新精神分析（如荣格、阿德勒、霍尼）则在个体潜意识之外引入集体潜意识、追求优越感、基本焦虑等概念。"
        ),
    },
    {
        "title": "人本主义流派概述",
        "chapter": "人格动力理论",
        "school": "人本主义",
        "text": (
            "人本主义以马斯洛和罗杰斯为代表。马斯洛提出需要层次理论与自我实现；"
            "罗杰斯强调自我概念、价值条件、积极关注与无条件积极关注；个人中心治疗的有效要素包括真诚、同感、积极关注。"
        ),
    },
    {
        "title": "特质理论概述",
        "chapter": "人格特质理论",
        "school": "特质理论",
        "text": (
            "奥尔波特把特质区分为枢纽特质、中心特质和次要特质；卡特尔通过因素分析得到 16PF；"
            "现代以大五人格 (OCEAN) 为主流：开放性、尽责性、外向性、宜人性、神经质。"
            "特质强调跨情境稳定性，但需谨慎区分情境影响。"
        ),
    },
    {
        "title": "社会学习与社会认知",
        "chapter": "人格动力理论",
        "school": "社会学习理论",
        "text": (
            "班杜拉的社会学习理论强调观察学习、替代经验、自我效能感与三元交互决定论（人-行为-环境）。"
            "罗特强调控制点（内控/外控）与期望-效价模型。"
        ),
    },
    {
        "title": "人格发展与适应",
        "chapter": "人格发展理论",
        "school": "综合",
        "text": (
            "埃里克森提出人格发展八阶段（信任 vs 不信任 …… 完善 vs 失望），每阶段都有发展任务与心理社会危机；"
            "人格适应良好通常表现为现实检验、情绪调节、稳定的人际关系与有意义感的目标追求。"
        ),
    },
    {
        "title": "人格测评基础",
        "chapter": "人格测评",
        "school": "综合",
        "text": (
            "人格测评常分自陈量表（如 MMPI、16PF、NEO-PI-R/大五）、投射测验（如罗夏、TAT）与情境测量。"
            "教学解释应强调：测评是参考与对话起点，不等于诊断；要关注信效度、文化适用性与情境信息。"
        ),
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.username == "teacher").first()
        uid = teacher.id if teacher else None
        if db.query(Document).count() > 0:
            print("已有文档，跳过种子写入。")
            return
        for s in SEEDS:
            doc = Document(title=s["title"], chapter=s["chapter"], school=s["school"], doc_type="material",
                           filename="seed.txt", uploaded_by=uid)
            db.add(doc)
            db.flush()
            db.add(Chunk(document_id=doc.id, chapter=s["chapter"], school=s["school"],
                         text=s["text"], tokens=" ".join(tokenize(s["text"]))))
        db.commit()
        print(f"已写入 {len(SEEDS)} 条种子文档。")
    finally:
        db.close()


if __name__ == "__main__":
    main()
