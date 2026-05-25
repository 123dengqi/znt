"""预置高质量章节测验：5 套 × 6 题 = 30 题，覆盖人格心理学主要章节与流派。
启动时会自动调用，仅在数据库中尚无对应"预置"测验时写入。
"""
from __future__ import annotations

from app.db import Base, SessionLocal, engine
from app.models import Question, Quiz, User


PRESET_QUIZZES: list[dict] = [
    {
        "title": "预置 · 人格动力理论（精神分析）",
        "chapter": "人格动力理论",
        "questions": [
            {
                "stem": "弗洛伊德提出的人格结构由哪三部分组成？",
                "options": ["A. 意识 / 前意识 / 潜意识", "B. 本我 / 自我 / 超我", "C. 自我 / 自尊 / 自我实现", "D. 童年期 / 青年期 / 老年期"],
                "answer": "B",
                "explanation": "本我（id）遵循快乐原则，自我（ego）遵循现实原则，超我（superego）代表道德与良心。",
            },
            {
                "stem": "下列哪一项最符合“防御机制”的概念？",
                "options": ["A. 对压力情境进行客观评估", "B. 主动寻求他人的反馈", "C. 通过压抑、否认等无意识方式缓解焦虑", "D. 制定明确的行动计划"],
                "answer": "C",
                "explanation": "防御机制是自我无意识地保护自身免受焦虑威胁的方式。",
            },
            {
                "stem": "弗洛伊德的性心理发展理论中，4-6 岁儿童正处于哪个阶段？",
                "options": ["A. 口唇期", "B. 肛门期", "C. 性器期", "D. 生殖期"],
                "answer": "C",
                "explanation": "性器期（phallic stage）大约在 3-6 岁，与“俄狄浦斯情结”相关。",
            },
            {
                "stem": "新精神分析学派中，强调“追求优越”和“自卑感”的代表人物是？",
                "options": ["A. 荣格", "B. 阿德勒", "C. 霍尼", "D. 弗洛姆"],
                "answer": "B",
                "explanation": "阿德勒提出个体心理学，强调追求优越与社会兴趣。",
            },
            {
                "stem": "“集体潜意识”这一概念由谁提出？",
                "options": ["A. 弗洛伊德", "B. 荣格", "C. 阿德勒", "D. 霍尼"],
                "answer": "B",
                "explanation": "荣格区分个体潜意识与集体潜意识，并提出原型概念。",
            },
            {
                "stem": "下列哪种解释最贴近精神分析视角对“反复迟到考试梦境”的教学化讨论？",
                "options": ["A. 单纯由生理因素引起", "B. 与潜意识中的焦虑或冲突有关", "C. 必然代表某种人格障碍", "D. 反映了大五人格中的尽责性"],
                "answer": "B",
                "explanation": "教学讨论时仅用于解释路径示例，不作临床诊断。",
            },
        ],
    },
    {
        "title": "预置 · 人本主义流派",
        "chapter": "人格动力理论",
        "questions": [
            {
                "stem": "马斯洛需要层次理论中，最高层次是？",
                "options": ["A. 生理需要", "B. 安全需要", "C. 自我实现需要", "D. 尊重需要"],
                "answer": "C",
                "explanation": "晚期马斯洛在自我实现之上又提出“自我超越”，但教材主流仍以自我实现为顶端。",
            },
            {
                "stem": "罗杰斯个人中心治疗中，治疗者应具备的三大基本态度不包括？",
                "options": ["A. 真诚", "B. 同感（共情）", "C. 无条件积极关注", "D. 严格指导"],
                "answer": "D",
                "explanation": "三大态度是真诚、同感与无条件积极关注，强调非指导式。",
            },
            {
                "stem": "罗杰斯关于“自我概念”的核心观点之一是？",
                "options": ["A. 自我概念由先天决定且不可改变", "B. 自我概念与现实经验之间的不一致会导致心理不适", "C. 自我概念等同于人格特质", "D. 自我概念不受环境影响"],
                "answer": "B",
                "explanation": "自我与经验的不一致是人本主义解释心理困扰的关键概念。",
            },
            {
                "stem": "下列哪项最能体现“积极关注”？",
                "options": ["A. 只在对方达成目标时给予关注", "B. 对个体作为人本身的接纳与尊重", "C. 对其行为进行严格评估", "D. 强调个体需要服从权威"],
                "answer": "B",
                "explanation": "积极关注尤其是无条件积极关注是人本主义的核心。",
            },
            {
                "stem": "“价值条件”（conditions of worth）这一概念意味着？",
                "options": ["A. 个体感到只有满足某些条件才被接纳", "B. 自我实现的必要前提", "C. 一种性格特质", "D. 一种防御机制"],
                "answer": "A",
                "explanation": "价值条件由重要他人加诸个体，可能造成自我与经验的失谐。",
            },
            {
                "stem": "人本主义对“人格异常”的总体倾向是？",
                "options": ["A. 强调遗传决定", "B. 强调诊断分类", "C. 强调成长与自我实现的受阻", "D. 强调强化历史"],
                "answer": "C",
                "explanation": "人本主义关注成长潜能，不以诊断分类为核心。",
            },
        ],
    },
    {
        "title": "预置 · 人格特质理论",
        "chapter": "人格特质理论",
        "questions": [
            {
                "stem": "现代主流的“大五人格”不包含下列哪一维度？",
                "options": ["A. 开放性", "B. 尽责性", "C. 控制点", "D. 神经质"],
                "answer": "C",
                "explanation": "大五（OCEAN）：开放性、尽责性、外向性、宜人性、神经质。控制点属于罗特的概念。",
            },
            {
                "stem": "卡特尔通过哪种方法得到了 16 个人格因素？",
                "options": ["A. 投射测验", "B. 因素分析", "C. 行为观察", "D. 案例研究"],
                "answer": "B",
                "explanation": "卡特尔基于因素分析得到 16PF。",
            },
            {
                "stem": "“尽责性”高的人在学习习惯上更可能表现为？",
                "options": ["A. 拖延与冲动", "B. 计划性强与目标坚持", "C. 喜欢冒险与刺激", "D. 容易被他人左右"],
                "answer": "B",
                "explanation": "尽责性与自律、计划性、目标坚持有关。",
            },
            {
                "stem": "奥尔波特将特质区分为？",
                "options": ["A. 显性 / 隐性", "B. 枢纽 / 中心 / 次要", "C. 内倾 / 外倾", "D. 稳定 / 不稳定"],
                "answer": "B",
                "explanation": "枢纽特质（cardinal）、中心特质（central）、次要特质（secondary）。",
            },
            {
                "stem": "关于特质的稳定性，较为恰当的说法是？",
                "options": ["A. 特质完全不随时间和情境变化", "B. 特质在跨情境中具有相对稳定性，但仍受情境影响", "C. 特质完全由情境决定", "D. 特质等同于一时的行为"],
                "answer": "B",
                "explanation": "现代特质观强调“相对稳定”和“情境调节”。",
            },
            {
                "stem": "人格测评工具 NEO-PI-R 主要测量？",
                "options": ["A. 16 个人格因素", "B. 大五人格", "C. 投射性人格", "D. 自我实现"],
                "answer": "B",
                "explanation": "NEO-PI-R 是测量大五人格及其细分面（facets）的代表性自陈量表。",
            },
        ],
    },
    {
        "title": "预置 · 社会学习与认知取向",
        "chapter": "人格动力理论",
        "questions": [
            {
                "stem": "班杜拉社会学习理论的核心机制不包括？",
                "options": ["A. 观察学习", "B. 自我效能", "C. 三元交互决定论", "D. 集体潜意识"],
                "answer": "D",
                "explanation": "集体潜意识是荣格的概念。",
            },
            {
                "stem": "“自我效能感”最直接地反映？",
                "options": ["A. 对自己能否完成某任务的判断", "B. 对他人能力的评估", "C. 对结果的客观估计", "D. 对环境的整体满意度"],
                "answer": "A",
                "explanation": "自我效能感是个体对自己组织和执行某行动以达成目标的信念。",
            },
            {
                "stem": "提升自我效能感的来源不包括？",
                "options": ["A. 亲历的成功体验", "B. 替代经验（榜样）", "C. 社会劝说与言语鼓励", "D. 强迫与惩罚"],
                "answer": "D",
                "explanation": "班杜拉主张正向来源：成败经验、替代经验、言语劝说、生理与情绪状态。",
            },
            {
                "stem": "罗特提出的“控制点”概念指？",
                "options": ["A. 个体对于行为强度的控制", "B. 个体相信结果取决于自身还是外部因素的倾向", "C. 个体的注意力广度", "D. 自我实现需要的强弱"],
                "answer": "B",
                "explanation": "内控倾向更相信自己的努力，外控更相信运气/权威等外部因素。",
            },
            {
                "stem": "下列哪一项最属于认知取向对人格不适应的解释？",
                "options": ["A. 关注潜意识冲突", "B. 关注自动思维与认知重评", "C. 关注本我冲动", "D. 关注价值条件"],
                "answer": "B",
                "explanation": "认知取向强调图式、自动思维与认知重评，是认知行为治疗的理论基础。",
            },
            {
                "stem": "“替代经验”最贴近的教学含义是？",
                "options": ["A. 通过观察他人成功/失败来调整自己的预期", "B. 通过自己反复失败的体验", "C. 通过药物训练获得行为", "D. 通过强迫记忆建立技能"],
                "answer": "A",
                "explanation": "替代经验是社会学习理论的关键来源之一。",
            },
        ],
    },
    {
        "title": "预置 · 人格测评与适应",
        "chapter": "人格测评",
        "questions": [
            {
                "stem": "下列哪一项属于自陈量表？",
                "options": ["A. MMPI", "B. 罗夏墨迹测验", "C. TAT", "D. 投射性绘画"],
                "answer": "A",
                "explanation": "MMPI、16PF、NEO-PI-R 等属自陈量表；罗夏与 TAT 属投射测验。",
            },
            {
                "stem": "关于人格测评结果的教学解释，更稳妥的态度是？",
                "options": ["A. 把测评结果当作最终诊断结论", "B. 仅作为对话起点，结合情境与多源信息谨慎理解", "C. 用以给个体贴标签", "D. 用以预测未来一切行为"],
                "answer": "B",
                "explanation": "教学场景应强调“参考与对话起点”，注意信效度与文化适用性。",
            },
            {
                "stem": "“信度”指的是？",
                "options": ["A. 测验的稳定性与一致性", "B. 测验是否测量了它声称要测量的内容", "C. 题目的难度", "D. 测验的题量"],
                "answer": "A",
                "explanation": "信度强调测量的稳定与一致；效度强调“是否测了该测的”。",
            },
            {
                "stem": "下列哪种说法更符合“人格适应良好”的教学化描述？",
                "options": ["A. 没有任何负面情绪", "B. 完全顺从他人期望", "C. 现实检验良好、情绪可调节、人际较稳定、生活有目标感", "D. 与所有人都关系密切"],
                "answer": "C",
                "explanation": "教学化描述强调多维表现，并避免与“无负面情绪”划等号。",
            },
            {
                "stem": "从教学边界看，本系统在面对学生“我是不是有 XX 症”的提问时应？",
                "options": ["A. 给出诊断", "B. 给出治疗方案", "C. 明确不进行临床诊断，并改为从教学层面解释相关概念", "D. 推荐药物"],
                "answer": "C",
                "explanation": "系统是教学辅助工具，必须坚守边界并引导专业资源。",
            },
            {
                "stem": "下列哪种做法最有利于学生的人格发展（教学化建议）？",
                "options": ["A. 强调单一标准的成功路径", "B. 鼓励反思、提供成长性反馈、关注个体差异", "C. 严格统一所有学习节奏", "D. 减少自我表达机会"],
                "answer": "B",
                "explanation": "符合人格发展与形成性评价取向。",
            },
        ],
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.username == "teacher").first()
        uid = teacher.id if teacher else None
        added = 0
        for q in PRESET_QUIZZES:
            exists = db.query(Quiz).filter(Quiz.title == q["title"]).first()
            if exists:
                continue
            quiz = Quiz(title=q["title"], chapter=q["chapter"], created_by=uid)
            db.add(quiz)
            db.flush()
            for it in q["questions"]:
                db.add(Question(
                    quiz_id=quiz.id,
                    stem=it["stem"],
                    options=it["options"],
                    answer=it["answer"],
                    explanation=it.get("explanation", ""),
                ))
            added += 1
        db.commit()
        if added:
            print(f"已写入 {added} 套预置测验。")
        else:
            print("已存在预置测验，跳过。")
    finally:
        db.close()


if __name__ == "__main__":
    main()
