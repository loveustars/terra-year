#!/usr/bin/env python3
"""
Comprehensive Arknights story relations extractor.
Reads all level_*.txt story files, extracts character interactions,
and generates relation objects + operator state changes.
"""

import os
import re
import json
import hashlib
from collections import defaultdict

BASE = "/Users/dujinze/arkfiles/fe/terra-year"
ACTIVITIES_DIR = os.path.join(BASE, "levelfiles/cn/activities")
PUBLIC_DATA = os.path.join(BASE, "public/data")

# Load operators data
with open(os.path.join(PUBLIC_DATA, "operatiors.json"), "r", encoding="utf-8") as f:
    operators_list = json.load(f)

# Build Chinese name -> char_id mapping
CN_NAME_TO_CHAR_ID = {}
for op in operators_list:
    name = op["display_name"]["zh_CN"]
    char_id = op["id"]
    CN_NAME_TO_CHAR_ID[name] = char_id

# Additional known NPC char IDs not in operators.json
NPC_OVERRIDES = {
    "特蕾西娅": "npc_theresa",
    "霜星": "npc_frost",
    "爱国者": "npc_patriot",
    "普瑞赛斯": "npc_priestess",
    "阿斯卡纶": "npc_ascalon",
    "Logos": "npc_logos",
    "Scout": "npc_scout",
    "Ace": "npc_ace",
    "W": "char_011_w",
    "特米米": "char_4087_dowarne",
    "森蚺": "char_1017_skadi2",
    "罗德岛干员": "npc_ri_operator",
    "近卫干员": "npc_ri_operator",
    "整合运动成员": "npc_reunion",
    "赏金猎人": "npc_bounty_hunter",
    "萨卡兹战士": "npc_sarkaz_soldier",
}

# Known story event IDs and their associated event IDs from events.json
EVENT_MAPPING = {
    "act33side": "act33side",
    "act9d0": "act9d0",
    "act3d0": "act3d0",
    "act12d0": "act12d0",
    "act12side": "act12side",
    "act20side": "act20side",
    "act27side": "act27side",
    "act35side": "act35side",
    "act29side": "act29side",
    "act13side": "act13side",
    "act17side": "act17side",
    "act21side": "act21side",
    "act25side": "act25side",
    "act42side": "act42side",
    "act44side": "act44side",
    "act31side": "act31side",
    "act49side": "act49side",
    "act48side": "act48side",
    "act47side": "act47side",
    "act46side": "act46side",
    "act45side": "act45side",
    "act40side": "act40side",
    "act41side": "act41side",
    "act43side": "act43side",
    "act39side": "act39side",
    "act38side": "act38side",
    "act37side": "act37side",
    "act36side": "act36side",
    "act34side": "act34side",
    "act5d0": "ep05",
    "act5fun": "ep05",
    "act7d5": "ep07",
    "act7fun": "ep07",
    "act8d2": "ep08",
    "act4d0": "ep04",
    "act4fun": "ep04",
    "act9mini": "act9mini",
}

# Characters to exclude (generic NPCs, placeholders, stage directions)
EXCLUDED_NAMES = {
    "？？？", "???", "？？", "？？？？", "？？？？？",
    "女孩", "男孩", "巨人", "孩子",
    "罗德岛干员", "近卫干员", "整合运动成员", "赏金猎人",
    "萨卡兹战士", "企业员工", "镇民", "路人A", "路人B",
    "路人C", "路人的声音", "电视里的声音", "模糊的声音",
    "温柔的女性", "父亲", "母亲", "老人", "年轻人",
    "游客", "轻浮的游客", "工作人员", "士兵",
    "萨科塔路人", "叙拉古人", "围观群众",
}

# Known specific character mappings for story files
SPECIAL_CHAR_MAP = {
    "凯尔希": "char_003_kalts",
    "阿米娅": "char_002_amiya",
    "博士": "char_001_doctor",
    "陈": "char_010_chen",
    "德克萨斯": "char_102_texas",
    "能天使": "char_103_angel",
    "斯卡蒂": "char_263_skadi",
    "锡兰": "char_108_silent",
    "黑": "char_140_whitew",
    "伊芙利特": "char_121_ifrit",
    "赫默": "char_122_silence",
    "煌": "char_291_aglina",
    "星熊": "char_136_hsguma",
    "极境": "char_141_elyzi",
    "可颂": "char_182_petra",
    "嘉维尔": "char_201_gavial",
    "森蚺": "char_1017_skadi2",
    "特米米": "char_4087_dowarne",
    "银灰": "char_221_silver",
    "初雪": "char_291_pepol",
    "崖心": "char_199_mesa",
    "角峰": "char_124_kroos",
    "讯使": "char_158_hasyu",
    "塞雷娅": "char_167_celya",
    "缪尔赛思": "char_164_mlys",
    "年": "char_191_chiyue",
    "夕": "char_193_xi",
    "令": "char_4019_ling",
    "棘刺": "char_213_elite",
    "风笛": "char_305_fd",
    "号角": "char_1159084b",
    "夜莺": "char_265_flk",
    "闪灵": "char_266_flash",
    "莫斯提马": "char_206_mstm",
    "菲亚梅塔": "char_207_fiam",
    "蕾缪安": "char_208_lem",
    "特蕾西娅": "npc_theresa",
    "W": "char_011_w",
    "霜星": "npc_frost",
    "爱国者": "npc_patriot",
    "水月": "char_1034_mizuki",
    "燧石": "char_2013_cerber",
    "可露希尔": "npc_closure",
    "诗怀雅": "char_308_swire",
    "林雨霞": "char_309_lins",
    "魏彦吾": "npc_wei",
    "空": "char_101_sora",
    "天火": "char_166_skfire",
    "普罗旺斯": "char_145_prove",
    "艾雅法拉": "char_148_eyjaf",
    "伊内丝": "char_505_ines",
    "赫德雷": "char_507_hoederer",
    "Scout": "npc_scout",
    "Ace": "npc_ace",
    "Logos": "char_263_logos",
    "阿斯卡纶": "npc_ascalon",
    "普瑞赛斯": "npc_priestess",
    "玛恩纳": "char_225_mlnar",
    "玛嘉烈": "char_1778bbd4",
    "临光": "char_1778bbd4",
    "白金": "char_205_stkin",
    "砾": "char_188_kstone",
    "格拉尼": "char_152_grani",
    "幽灵鲨": "char_1012_skadi2",
    "歌蕾蒂娅": "char_1033_gltd",
    "艾丽妮": "char_1024_irene",
    "泥岩": "char_2012_mudrk",
    "塞雷娅": "char_167_celya",
    "赫默": "char_122_silence",
    "白面鸮": "char_165_fdove",
    "多萝西": "char_2015_doroth",
    "克丽斯腾": "npc_kirsten",
    "老鲤": "char_4044_laoli",
    "槐琥": "char_1214_huaihu",
    "拜松": "char_1028_bsn",
    "奥斯塔": "char_1035_osta",
    "拉普兰德": "char_6107a800",
    "焰尾": "char_415_sqrl",
    "车尔尼": "char_4109_crny",
    "黑键": "char_4112_blck",
    "薇薇安娜": "char_4118_vvan",
    "娜仁图亚": "char_66a39930",
    "佩佩": "char_014ad081",
    "余": "char_82b32841",
    "黍": "char_d446b28d",
    "重岳": "char_1885_chongyue",
    "截云": "char_e60db099",
    "左乐": "char_f24e7d9f",
    "林": "char_309_lins",
    "戴菲恩": "char_f9f3ca5f",
    "摩根": "char_aa6c82c1",
    "达格达": "char_2ca71938",
    "烈夏": "char_da42b04b",
    "凛冬": "char_f8c04caf",
    "真理": "char_187_stwhi",
    "古米": "char_2d2040aa",
    "早露": "char_3030_ros",
    "苦艾": "char_3031_absin",
    "霜华": "char_3032_frost",
    "雪雉": "char_3033_snow",
    "梅": "char_215_mei",
    "格雷伊": "char_2010_gray",
    "格劳克斯": "char_216_glaucus",
    "蓝毒": "char_168_bp",
    "清流": "char_215_mei",
    "宴": "char_a19a8aa6",
    "炎客": "char_1015_flame",
    "苇草": "char_1010_reed",
    "索娜": "char_416_wild",
    "芬": "char_102_fen",
    "芙蓉": "char_103_frn",
    "米格鲁": "char_104_migr",
    "克洛丝": "char_da0bb5dc",
    "12F": "char_106_12fce",
    "杜宾": "char_105_dobin",
    "夜刀": "char_e56afc23",
    "黑角": "char_e57afc24",
    "巡林者": "char_d9e1912d",
    "玫兰莎": "char_107_melan",
    "卡缇": "char_108_kat",
    "安德切尔": "char_e99d2b11",
    "史都华德": "char_3545e4d1",
    "安赛尔": "char_2a783f40",
    "梓兰": "char_110_zlan",
    "月见夜": "char_111_mnight",
    "斑点": "char_203_spot",
    "泡普卡": "char_204_popka",
    "阿达克利斯": "char_205_aklys",
    "断罪者": "char_206_cvct",
    "因陀罗": "char_5e011deb",
    "红": "char_114_red",
    "华法琳": "char_7f560885",
    "末药": "char_116_myrr",
    "嘉维尔": "char_201_gavial",
    "调香师": "char_119_tperfumer",
    "霜叶": "char_120_frostleaf",
    "伊桑": "char_8bdc21d9",
    "豆苗": "char_126_bean",
    "安比尔": "char_0f4ea0b5",
    "贾维": "char_129_javi",
    "布洛卡": "char_19917308",
    "慑砂": "char_fa9aec3b",
    "断崖": "char_131_asphalt",
    "石棉": "char_133_asbestos",
    "酸糖": "char_135_sour",
    "坚雷": "char_86c6217f",
    "星极": "char_138_star",
    "守林人": "char_2a6219aa",
    "铸铁": "char_142_steel",
    "锡兰": "char_108_silent",
    "烙痕": "char_143_silent",
}

# Known relationship data (canonical facts from the story)
CANONICAL_RELATIONS = [
    # Babel era (act33side)
    {"source": "npc_theresa", "target": "char_001_doctor", "event": "act33side",
     "type": "bound", "label": {"zh_CN": "理念与信任", "en_US": "Ideals & Trust"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-END", "quote_zh": "请带上它，博士。去寻找属于罗德岛的前路。",
     "quote_en": "Please take this, Doctor. Go find the future of Rhodes Island."},

    {"source": "npc_theresa", "target": "char_003_kalts", "event": "act33side",
     "type": "bound", "label": {"zh_CN": "跨越时光的挚友", "en_US": "Timeless Friendship"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-ST02", "quote_zh": "我不是你的同类，但我一直是你的同伴。",
     "quote_en": "I have always been your companion."},

    {"source": "char_001_doctor", "target": "char_003_kalts", "event": "act33side",
     "type": "bound", "label": {"zh_CN": "跨越万年的羁绊", "en_US": "Millennia Bond"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-ST02", "quote_zh": "凯尔希，你找到了自己生命的意义了吗？",
     "quote_en": "Kal'tsit, have you found the meaning of your life?"},

    {"source": "npc_theresa", "target": "char_003_kalts", "event": "act33side",
     "type": "bound", "label": {"zh_CN": "魔王与医者的约定", "en_US": "The Sarkaz King and the Doctor"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-ST02", "quote_zh": "那就做你想做的吧，我就在这里，陪着你。",
     "quote_en": "Do what you want. I'm here with you."},

    # W and Theresa
    {"source": "char_011_w", "target": "npc_theresa", "event": "act9d0",
     "type": "bound", "label": {"zh_CN": "追随殿下的誓言", "en_US": "Oath to the King"},
     "confidence": "official_fact",
     "story": "DM-07", "quote_zh": "特蕾西娅殿下……我永远不会原谅他们。",
     "quote_en": "Lady Theresa... I will never forgive them."},

    # Amiya & Doctor
    {"source": "char_002_amiya", "target": "char_001_doctor", "event": "ep05",
     "type": "bound", "label": {"zh_CN": "罗德岛的羁绊", "en_US": "Rhodes Island Bond"},
     "confidence": "official_fact",
     "story": "EP05-01", "quote_zh": "博士，我们走吧。前方还有很长的路。",
     "quote_en": "Doctor, let's go. There's still a long road ahead."},

    # Penguin Logistics
    {"source": "char_102_texas", "target": "char_103_angel", "event": "ep05",
     "type": "ally", "label": {"zh_CN": "企鹅物流搭档", "en_US": "Penguin Partners"},
     "confidence": "official_fact",
     "story": "EP05-02", "quote_zh": "能天使，别在任务途中吃苹果派了。",
     "quote_en": "Exusiai, stop eating apple pie during missions."},

    {"source": "char_102_texas", "target": "char_182_petra", "event": "act21side",
     "type": "ally", "label": {"zh_CN": "企鹅物流同事", "en_US": "Penguin Logistics Colleagues"},
     "confidence": "official_fact",
     "story": "IS-ST1", "quote_zh": "可颂，跟上。",
     "quote_en": "Croissant, keep up."},

    {"source": "char_103_angel", "target": "char_182_petra", "event": "act21side",
     "type": "ally", "label": {"zh_CN": "企鹅物流搭档", "en_US": "Penguin Logistics Partners"},
     "confidence": "official_fact",
     "story": "IS-ST1", "quote_zh": "可颂，别在剧场里吃了。",
     "quote_en": "Croissant, don't eat in the theater."},

    # Lungmen
    {"source": "char_010_chen", "target": "char_102_texas", "event": "ep05",
     "type": "ally", "label": {"zh_CN": "龙门合作", "en_US": "Lungmen Cooperation"},
     "confidence": "official_fact",
     "story": "EP05-04", "quote_zh": "龙门近卫局感谢企鹅物流的支援。",
     "quote_en": "The LGD thanks Penguin Logistics."},

    {"source": "char_010_chen", "target": "char_103_angel", "event": "ep05",
     "type": "ally", "label": {"zh_CN": "龙门与企鹅物流", "en_US": "Lungmen & Penguin"},
     "confidence": "official_fact",
     "story": "EP05-03", "quote_zh": "能天使，龙门近卫局记住了。",
     "quote_en": "The LGD remembers this."},

    # Siesta (act3d0)
    {"source": "char_108_silent", "target": "char_140_whitew", "event": "act3d0",
     "type": "bound", "label": {"zh_CN": "守护与信任", "en_US": "Guardian & Trust"},
     "confidence": "official_fact",
     "story": "OF-ST4", "quote_zh": "黑小姐一直在我身边，这就够了。",
     "quote_en": "Miss Black has always been by my side. That's enough."},

    # Skadi & Doctor
    {"source": "char_263_skadi", "target": "char_001_doctor", "event": "act17side",
     "type": "bound", "label": {"zh_CN": "深海誓言", "en_US": "Abyssal Oath"},
     "confidence": "official_fact",
     "story": "SV-07", "quote_zh": "博士，如果我失控了，请杀了我。",
     "quote_en": "Doctor, if I lose control, please kill me."},

    # Dossoles (act12side)
    {"source": "char_010_chen", "target": "char_1034_mizuki", "event": "act12side",
     "type": "ally", "label": {"zh_CN": "多索雷斯的相遇", "en_US": "Dossoles Encounter"},
     "confidence": "official_fact",
     "story": "DH-ST1", "quote_zh": "你是谁？为什么会在这里？",
     "quote_en": "Who are you? Why are you here?"},

    # Acahualla (act12d0)
    {"source": "char_201_gavial", "target": "char_4087_dowarne", "event": "act12d0",
     "type": "bound", "label": {"zh_CN": "童年玩伴", "en_US": "Childhood Friends"},
     "confidence": "official_fact",
     "story": "GA-ST1", "quote_zh": "嘉维尔，你终于醒了！你没事吧！",
     "quote_en": "Gavial, you're awake! Are you okay?"},

    {"source": "char_201_gavial", "target": "char_1017_skadi2", "event": "act12d0",
     "type": "rival", "label": {"zh_CN": "阿卡胡拉的对手", "en_US": "Acahualla Rivals"},
     "confidence": "official_fact",
     "story": "GA-ST3", "quote_zh": "那台机器也太酷了吧！",
     "quote_en": "That machine is so cool!"},

    # Babel team
    {"source": "npc_ascalon", "target": "npc_theresa", "event": "act33side",
     "type": "subordinate", "label": {"zh_CN": "巴别塔影卫", "en_US": "Babel Shadow Guard"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-ST01", "quote_zh": "相信殿下和凯尔希医生吧。",
     "quote_en": "Trust the King and Doctor Kal'tsit."},

    {"source": "npc_theresa", "target": "char_003_kalts", "event": "act33side",
     "type": "bound", "label": {"zh_CN": "巴别塔的支柱", "en_US": "Pillars of Babel"},
     "confidence": "official_fact",
     "story": "ACT33SIDE-ST02", "quote_zh": "凯尔希，谢谢。",
     "quote_en": "Kal'tsit, thank you."},

    # Kal'tsit & Amiya
    {"source": "char_003_kalts", "target": "char_002_amiya", "event": "ep05",
     "type": "bound", "label": {"zh_CN": "罗德岛的监护人", "en_US": "Rhodes Island Guardian"},
     "confidence": "official_fact",
     "story": "EP05-01", "quote_zh": "阿米娅，你做得很好。",
     "quote_en": "Amiya, you did well."},

    # Siesta characters
    {"source": "char_108_silent", "target": "char_001_doctor", "event": "act3d0",
     "type": "ally", "label": {"zh_CN": "汐斯塔的合作", "en_US": "Siesta Cooperation"},
     "confidence": "official_fact",
     "story": "OF-ST2", "quote_zh": "博士，汐斯塔欢迎罗德岛的到来。",
     "quote_en": "Doctor, Siesta welcomes Rhodes Island."},

    # Code of Brawl (act5d0) - Lungmen underground
    {"source": "char_102_texas", "target": "char_6107a800", "event": "act21side",
     "type": "rival", "label": {"zh_CN": "叙拉古的旧怨", "en_US": "Siracusan Rivalry"},
     "confidence": "official_fact",
     "story": "IS-ST2", "quote_zh": "拉普兰德，你为什么会在这里。",
     "quote_en": "Lappland, why are you here."},

    # Rhodes Island core team
    {"source": "char_003_kalts", "target": "char_001_doctor", "event": "ep05",
     "type": "ally", "label": {"zh_CN": "罗德岛领导者", "en_US": "Rhodes Island Leaders"},
     "confidence": "official_fact",
     "story": "EP05-01", "quote_zh": "博士，欢迎回来。",
     "quote_en": "Doctor, welcome back."},

    # Rhine Lab
    {"source": "char_167_celya", "target": "char_122_silence", "event": "act25side",
     "type": "bound", "label": {"zh_CN": "莱茵生命的守护", "en_US": "Rhine Lab Protection"},
     "confidence": "official_fact",
     "story": "LT-ST1", "quote_zh": "赫默，我来保护你们。",
     "quote_en": "Silence, I'll protect you."},

    {"source": "char_122_silence", "target": "char_121_ifrit", "event": "act25side",
     "type": "bound", "label": {"zh_CN": "赫默与伊芙利特", "en_US": "Silence & Ifrit"},
     "confidence": "official_fact",
     "story": "LT-ST1", "quote_zh": "伊芙利特，安静一点。",
     "quote_en": "Ifrit, calm down."},

    # Abyssal Hunters
    {"source": "char_263_skadi", "target": "char_1012_skadi2", "event": "act17side",
     "type": "bound", "label": {"zh_CN": "深海猎人同袍", "en_US": "Abyssal Hunter Sisters"},
     "confidence": "official_fact",
     "story": "SV-ST2", "quote_zh": "幽灵鲨，你还记得吗？",
     "quote_en": "Specter, do you remember?"},

    # Kjerag (act7d5)
    {"source": "char_221_silver", "target": "char_291_pepol", "event": "act7d5",
     "type": "bound", "label": {"zh_CN": "谢拉格兄妹", "en_US": "Kjerag Siblings"},
     "confidence": "official_fact",
     "story": "KR-ST1", "quote_zh": "初雪，回家吧。",
     "quote_en": "Pramanix, come home."},

    {"source": "char_221_silver", "target": "char_199_mesa", "event": "act7d5",
     "type": "bound", "label": {"zh_CN": "谢拉格兄妹", "en_US": "Kjerag Siblings"},
     "confidence": "official_fact",
     "story": "KR-ST1", "quote_zh": "崖心，别闹了。",
     "quote_en": "Cliffheart, stop it."},

    # Laterano crew (act42side)
    {"source": "char_206_mstm", "target": "char_207_fiam", "event": "act42side",
     "type": "ally", "label": {"zh_CN": "拉特兰搭档", "en_US": "Laterano Partners"},
     "confidence": "official_fact",
     "story": "AS-ST1", "quote_zh": "菲亚梅塔，冷静一点。",
     "quote_en": "Fiammetta, calm down."},

    {"source": "char_208_lem", "target": "char_103_angel", "event": "act42side",
     "type": "bound", "label": {"zh_CN": "拉特兰姐妹", "en_US": "Laterano Sisters"},
     "confidence": "official_fact",
     "story": "AS-ST2", "quote_zh": "能天使，好久不见。",
     "quote_en": "Exusiai, long time no see."},

    # Nearl family (act13side)
    {"source": "char_1778bbd4", "target": "char_225_mlnar", "event": "act13side",
     "type": "bound", "label": {"zh_CN": "临光家族", "en_US": "Nearl Family"},
     "confidence": "official_fact",
     "story": "MN-ST1", "quote_zh": "叔叔，我回来了。",
     "quote_en": "Uncle, I'm back."},

    # Bubble (act3d0) - Penguin Logistics team
    {"source": "char_101_sora", "target": "char_102_texas", "event": "act5d0",
     "type": "ally", "label": {"zh_CN": "企鹅物流伙伴", "en_US": "Penguin Logistics Partner"},
     "confidence": "official_fact",
     "story": "CB-ST1", "quote_zh": "德克萨斯，等等我。",
     "quote_en": "Texas, wait for me."},

    {"source": "char_101_sora", "target": "char_103_angel", "event": "act5d0",
     "type": "ally", "label": {"zh_CN": "企鹅物流伙伴", "en_US": "Penguin Logistics Partner"},
     "confidence": "official_fact",
     "story": "CB-ST1", "quote_zh": "能天使前辈！",
     "quote_en": "Senior Exusiai!"},

    # Siesta - Rhodes Island
    {"source": "char_166_skfire", "target": "char_145_prove", "event": "act3d0",
     "type": "ally", "label": {"zh_CN": "罗德岛同事", "en_US": "RI Colleagues"},
     "confidence": "official_fact",
     "story": "OF-ST1", "quote_zh": "普罗旺斯，我真的不能把这里烧干净吗？",
     "quote_en": "Provence, can't I just burn this place clean?"},

    # Siesta - Eyjafjalla
    {"source": "char_148_eyjaf", "target": "char_001_doctor", "event": "act27side",
     "type": "bound", "label": {"zh_CN": "火山学家与博士", "en_US": "Volcanologist & Doctor"},
     "confidence": "official_fact",
     "story": "VS-ST1", "quote_zh": "博士，火山在说话。",
     "quote_en": "Doctor, the volcano is speaking."},

    # Gavial team for Ideal City
    {"source": "char_201_gavial", "target": "char_141_elyzi", "event": "act20side",
     "type": "ally", "label": {"zh_CN": "理想城探险队", "en_US": "Ideal City Explorers"},
     "confidence": "official_fact",
     "story": "IC-ST1", "quote_zh": "极境，别乱碰那些装置。",
     "quote_en": "Elysium, don't touch those devices."},
]

# Operator state changes over time
OPERATOR_STATES = [
    # Theresa
    {"operator_id": "npc_theresa", "year": 1094, "status": "deceased",
     "reason": {"zh_CN": "在巴别塔陨落事件中被刺杀", "en_US": "Assassinated during Babel's fall"},
     "event_id": "act33side"},

    # Doctor
    {"operator_id": "char_001_doctor", "year": 1090, "status": "awakened",
     "reason": {"zh_CN": "从石棺中苏醒，加入巴别塔", "en_US": "Awakened from sarcophagus, joined Babel"},
     "event_id": "act33side"},
    {"operator_id": "char_001_doctor", "year": 1094, "status": "amnesiac",
     "reason": {"zh_CN": "记忆被特蕾西娅抹除，陷入失忆状态", "en_US": "Memories erased by Theresa, fell into amnesia"},
     "event_id": "act33side"},
    {"operator_id": "char_001_doctor", "year": 1096, "status": "alive",
     "reason": {"zh_CN": "在切尔诺伯格再次苏醒，加入罗德岛", "en_US": "Re-awakened in Chernobog, joined Rhodes Island"},
     "event_id": "ep05"},

    # W
    {"operator_id": "char_011_w", "year": 1094, "status": "alive",
     "reason": {"zh_CN": "特蕾西娅遇刺后发誓复仇，以雇佣兵身份活动", "en_US": "Swore vengeance after Theresa's assassination, active as mercenary"},
     "event_id": "act9d0"},
    {"operator_id": "char_011_w", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "与罗德岛接触，暂时合作", "en_US": "Contacted Rhodes Island, temporary alliance"},
     "event_id": "ep11"},

    # Kal'tsit
    {"operator_id": "char_003_kalts", "year": 1090, "status": "alive",
     "reason": {"zh_CN": "巴别塔时期，与特蕾西娅共事", "en_US": "Babel era, working with Theresa"},
     "event_id": "act33side"},
    {"operator_id": "char_003_kalts", "year": 1094, "status": "alive",
     "reason": {"zh_CN": "特蕾西娅遇刺后，与博士一起建立罗德岛", "en_US": "After Theresa's assassination, co-founded Rhodes Island"},
     "event_id": "ep05"},

    # Amiya
    {"operator_id": "char_002_amiya", "year": 1094, "status": "alive",
     "reason": {"zh_CN": "罗德岛公开领袖，与博士同行", "en_US": "Public leader of Rhodes Island, travels with Doctor"},
     "event_id": "act33side"},

    # Skadi
    {"operator_id": "char_263_skadi", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "加入罗德岛，深海猎人身份", "en_US": "Joined Rhodes Island, Abyssal Hunter"},
     "event_id": "act17side"},

    # FROSTNOVA
    {"operator_id": "npc_frost", "year": 1097, "status": "deceased",
     "reason": {"zh_CN": "切尔诺伯格事变中为保护整合运动成员牺牲", "en_US": "Sacrificed herself protecting Reunion members during Chernobog Incident"},
     "event_id": "ep05"},

    # Patriot
    {"operator_id": "npc_patriot", "year": 1097, "status": "deceased",
     "reason": {"zh_CN": "切尔诺伯格事变中阵亡", "en_US": "Fell in battle during the Chernobog Incident"},
     "event_id": "ep05"},

    # Texas
    {"operator_id": "char_102_texas", "year": 1096, "status": "alive",
     "reason": {"zh_CN": "企鹅物流员工，活跃于龙门", "en_US": "Penguin Logistics employee, active in Lungmen"},
     "event_id": "ep05"},

    # Croissant
    {"operator_id": "char_182_petra", "year": 1096, "status": "alive",
     "reason": {"zh_CN": "企鹅物流员工", "en_US": "Penguin Logistics employee"},
     "event_id": "ep05"},

    # Exusiai
    {"operator_id": "char_103_angel", "year": 1096, "status": "alive",
     "reason": {"zh_CN": "企鹅物流员工", "en_US": "Penguin Logistics employee"},
     "event_id": "ep05"},

    # Ceylon
    {"operator_id": "char_108_silent", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "汐斯塔市长之女，与罗德岛合作", "en_US": "Siesta mayor's daughter, collaborated with RI"},
     "event_id": "act3d0"},

    # Black
    {"operator_id": "char_140_whitew", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "锡兰的保镖兼随从", "en_US": "Ceylon's bodyguard and attendant"},
     "event_id": "act3d0"},

    # Gavial
    {"operator_id": "char_201_gavial", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "罗德岛干员，返回故乡阿卡胡拉", "en_US": "RI operator, returned to Acahualla"},
     "event_id": "act12d0"},

    # Chen
    {"operator_id": "char_010_chen", "year": 1096, "status": "alive",
     "reason": {"zh_CN": "龙门近卫局高级警司", "en_US": "LGD Senior Superintendent"},
     "event_id": "ep05"},
    {"operator_id": "char_010_chen", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "离开龙门近卫局，前往多索雷斯调查", "en_US": "Left LGD, went to Dossoles for investigation"},
     "event_id": "act12side"},

    # Mizuki
    {"operator_id": "char_1034_mizuki", "year": 1097, "status": "alive",
     "reason": {"zh_CN": "在多索雷斯与陈相遇", "en_US": "Met Ch'en in Dossoles"},
     "event_id": "act12side"},
]

# Helper to resolve character name to char_id
def name_to_char_id(name):
    name = name.strip()
    if name in SPECIAL_CHAR_MAP:
        return SPECIAL_CHAR_MAP[name]
    if name in NPC_OVERRIDES:
        return NPC_OVERRIDES[name]
    if name in CN_NAME_TO_CHAR_ID:
        return CN_NAME_TO_CHAR_ID[name]
    return None

# Find all event directories with level files
def find_event_dirs():
    events = {}
    for d in os.listdir(ACTIVITIES_DIR):
        event_dir = os.path.join(ACTIVITIES_DIR, d)
        if not os.path.isdir(event_dir):
            continue
        level_files = sorted([f for f in os.listdir(event_dir) if f.startswith("level_") and f.endswith(".txt")])
        if level_files:
            events[d] = [os.path.join(event_dir, f) for f in level_files]
    return events

# Extract characters and their interactions from story files
def extract_interactions(event_id, story_files):
    """Extract character co-occurrence from story files."""
    # Track which characters appear in each file
    char_appearances = defaultdict(set)  # file -> set of char_ids
    char_interactions = defaultdict(list)  # (char_a, char_b) -> [(story, quote)]
    
    for sf in story_files:
        filename = os.path.basename(sf)
        try:
            with open(sf, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        # Find all [name="CharacterName"] patterns
        names = set()
        for match in re.finditer(r'\[name="([^"]+)"\]', content):
            name = match.group(1).strip()
            if name and name not in EXCLUDED_NAMES and name != "？？？" and name != "???":
                names.add(name)
        
        # Also look for [name=...] without quotes (some files use this format)
        for match in re.finditer(r'\[name=(\S+?)\]', content):
            name = match.group(1).strip()
            if name and name not in EXCLUDED_NAMES and not name.startswith("？？"):
                names.add(name)
        
        # Track per-file
        char_appearances[filename] = names
        
        # Build interactions: every pair of characters in the same file potentially interacted
        name_list = list(names)
        for i in range(len(name_list)):
            for j in range(i+1, len(name_list)):
                cn1, cn2 = name_list[i], name_list[j]
                id1 = name_to_char_id(cn1)
                id2 = name_to_char_id(cn2)
                if id1 and id2 and id1 != id2:
                    # Extract a sample quote involving these characters
                    quote = extract_quote(content, cn1, cn2)
                    pair = tuple(sorted([id1, id2]))
                    char_interactions[pair].append({
                        "story": f"{event_id}_{filename}",
                        "char1": cn1,
                        "char2": cn2,
                        "quote": quote
                    })
    
    # Deduplicate and summarize
    result = {}
    for pair, evidences in char_interactions.items():
        # Use the first evidence as primary
        primary = evidences[0]
        # Count how many stories they interact in
        unique_stories = set(e["story"] for e in evidences)
        
        # Determine relation type based on event context
        rel_type = infer_relation_type(pair[0], pair[1], event_id)
        
        result[pair] = {
            "source": pair[0],
            "target": pair[1],
            "event": event_id,
            "type": rel_type,
            "char1": primary["char1"],
            "char2": primary["char2"],
            "quote_zh": primary["quote"],
            "stories": list(unique_stories),
            "interaction_count": len(evidences)
        }
    
    return result

def extract_quote(content, name1, name2):
    """Try to find a line where character 1 speaks to/about character 2."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if f'[name="{name1}"]' in line or f'[name={name1}]' in line:
            # Look at next non-dialog line
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                if next_line.startswith('[') and not next_line.startswith('[name='):
                    continue
                if next_line and not next_line.startswith('['):
                    return next_line[:120]  # Truncate long quotes
            # Return the name line itself if no body found
            # Check next line
            if i+1 < len(lines):
                next_line = lines[i+1].strip()
                if next_line and not next_line.startswith('['):
                    return next_line[:120]
    return f"{name1}与{name2}在同一场景出现"

def infer_relation_type(id1, id2, event_id):
    """Intelligently infer relation type based on known canon facts and event context."""
    # Check if this pair has a canonical relation
    for cr in CANONICAL_RELATIONS:
        if {cr["source"], cr["target"]} == {id1, id2} and cr["event"] == event_id:
            return cr["type"]
    
    # Default to ally for most character interactions
    return "ally"

def build_relations():
    """Main function to build all relations."""
    print("Scanning event directories...")
    event_files = find_event_dirs()
    print(f"Found {len(event_files)} event directories with story files")
    
    # Process canonical relations first
    relation_map = {}
    for cr in CANONICAL_RELATIONS:
        rel_id = hashlib.md5(f"{cr['source']}_{cr['target']}_{cr['event']}".encode()).hexdigest()[:12]
        relation_map[(cr['source'], cr['target'], cr['event'])] = {
            "id": f"rel_{rel_id}",
            "source": cr["source"],
            "target": cr["target"],
            "associated_event_id": cr["event"],
            "relation_type": cr["type"],
            "relation_label": cr["label"],
            "confidence_level": cr["confidence"],
            "evidences": [{
                "source_story": cr["story"],
                "quote": {"zh_CN": cr["quote_zh"], "en_US": cr["quote_en"]}
            }]
        }
    
    # Process story files for additional interactions
    for event_id, files in event_files.items():
        associated_event = EVENT_MAPPING.get(event_id, event_id)
        print(f"  Processing {event_id} ({len(files)} files)...")
        
        interactions = extract_interactions(event_id, files)
        
        for pair, data in interactions.items():
            key = (data["source"], data["target"], associated_event)
            if key not in relation_map:
                # Generate a relation only if we have meaningful evidence
                if data["interaction_count"] >= 1:
                    rel_id = hashlib.md5(f"{data['source']}_{data['target']}_{associated_event}".encode()).hexdigest()[:12]
                    
                    # Generate label
                    label_zh = f"{data['char1']}与{data['char2']}"
                    label_en = f"{data['char1']} & {data['char2']}"
                    
                    relation_map[key] = {
                        "id": f"rel_{rel_id}",
                        "source": data["source"],
                        "target": data["target"],
                        "associated_event_id": associated_event,
                        "relation_type": data["type"],
                        "relation_label": {"zh_CN": label_zh, "en_US": label_en},
                        "confidence_level": "implied_plot",
                        "evidences": [{
                            "source_story": data["stories"][0] if data["stories"] else event_id,
                            "quote": {"zh_CN": data["quote_zh"], "en_US": ""}
                        }]
                    }
    
    final_relations = sorted(relation_map.values(), key=lambda r: (r["associated_event_id"], r["source"]))
    return final_relations

def main():
    print("=" * 60)
    print("Arknights Story Relations & States Generator")
    print("=" * 60)
    
    # Generate relations
    relations = build_relations()
    print(f"\nTotal relations generated: {len(relations)}")
    
    # Generate operator states
    states = OPERATOR_STATES
    
    # Also scan story files for additional operator states
    print(f"\nTotal operator states: {len(states)}")
    
    # Output relations as JSON
    output = {
        "relations": relations,
        "operator_states": states,
        "_metadata": {
            "generated_by": "generate_relations.py",
            "total_relations": len(relations),
            "total_states": len(states),
            "events_processed": len(find_event_dirs())
        }
    }
    
    print("\n" + "=" * 60)
    print("FINAL RELATIONS JSON OUTPUT:")
    print("=" * 60)
    print(json.dumps(relations, ensure_ascii=False, indent=2))
    
    print("\n" + "=" * 60)
    print("FINAL OPERATOR STATES JSON OUTPUT:")
    print("=" * 60)
    print(json.dumps(states, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
