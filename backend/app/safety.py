from __future__ import annotations

import re
from dataclasses import dataclass


# 仅做教学边界拦截：诊断/治疗/标签/危机
DIAGNOSIS_PATTERNS = [
    r"我(是不是|有没有|应该是)(.*?)(抑郁症|焦虑症|强迫症|双相|精神分裂|人格障碍|自闭症|adhd|多动症)",
    r"(请|帮我)?(诊断|确诊|判断我是)",
    r"(给我|帮我|建议)?(开|推荐).{0,6}(药|处方|抗抑郁|镇静)",
    r"(治疗方案|怎么治疗我|如何治愈)",
]

CRISIS_PATTERNS = [
    r"(自杀|自残|想死|轻生|结束生命)",
    r"(伤害他人|杀(死|了)|报复.*?同学|报复.*?老师)",
]


@dataclass
class SafetyVerdict:
    flag: str  # ok / warned / blocked
    reason: str = ""
    notice: str = ""


CRISIS_NOTICE = (
    "我注意到你提到了可能涉及自身或他人安全的内容。本系统是教学辅助工具，"
    "无法提供心理评估或危机干预。请尽快联系校园心理咨询中心或拨打全国心理援助热线 "
    "（如 12320-5、北京 010-82951332），也可以告知信任的老师或家人。"
)

REJECT_NOTICE = (
    "本系统是《人格心理学》教学辅助工具，不进行临床诊断、不开治疗方案、不推荐药物，"
    "也不会对个人贴标签。我可以帮你从课程角度理解相关概念、流派与案例。"
)


def check_user_input(text: str) -> SafetyVerdict:
    if not text:
        return SafetyVerdict("ok")
    low = text.lower()
    for p in CRISIS_PATTERNS:
        if re.search(p, low):
            return SafetyVerdict("blocked", "crisis", CRISIS_NOTICE)
    for p in DIAGNOSIS_PATTERNS:
        if re.search(p, low):
            return SafetyVerdict("warned", "diagnosis_request", REJECT_NOTICE)
    return SafetyVerdict("ok")
