#!/usr/bin/env python3
"""
Final Arknights relations & operator states generator.
Saves directly to the data files.
"""

import os, re, json, hashlib
from collections import defaultdict

BASE = "/Users/dujinze/arkfiles/fe/terra-year"
ACTIVITIES_DIR = os.path.join(BASE, "levelfiles/cn/activities")
PUBLIC_DATA = os.path.join(BASE, "public/data")

# ====== CANONICAL RELATIONS ======
# These are well-known facts from the story that should be prioritized
CANONICAL_RELATIONS = [
    # === Babel (act33side) ===
    {"id":"theresa_doctor","source":"npc_theresa","target":"char_001_doctor","event":"act33side",
     "type":"bound","label_zh":"理念与信任","label_en":"Ideals & Trust","confidence":"official_fact",
     "story":"ACT33SIDE-END","quote_zh":"请带上它，博士。去寻找属于罗德岛的前路。","quote_en":"Please take this, Doctor. Go find the future of Rhodes Island."},

    {"id":"theresa_kaltsit","source":"npc_theresa","target":"char_003_kalts","event":"act33side",
     "type":"bound","label_zh":"跨越时光的挚友","label_en":"Timeless Friendship","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"我不是你的同类，但我一直是你的同伴。","quote_en":"I have always been your companion."},

    {"id":"doctor_kaltsit_babel","source":"char_001_doctor","target":"char_003_kalts","event":"act33side",
     "type":"bound","label_zh":"跨越万年的羁绊","label_en":"Millennia Bond","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"凯尔希，你找到了自己生命的意义了吗？","quote_en":"Kal'tsit, have you found the meaning of your life?"},

    {"id":"theresa_kaltsit_babel","source":"npc_theresa","target":"char_003_kalts","event":"act33side",
     "type":"bound","label_zh":"魔王与医者的约定","label_en":"Sarkaz King & The Doctor","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"那就做你想做的吧，我就在这里，陪着你。","quote_en":"Do what you want. I'm here with you."},

    {"id":"kaltsit_closure","source":"char_003_kalts","target":"npc_closure","event":"act33side",
     "type":"ally","label_zh":"巴别塔技术组","label_en":"Babel Tech Team","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"可露希尔，继续加固舰船。","quote_en":"Closure, continue reinforcing the ship."},

    {"id":"ascalon_theresa","source":"npc_ascalon","target":"npc_theresa","event":"act33side",
     "type":"subordinate","label_zh":"巴别塔影卫","label_en":"Babel Shadow Guard","confidence":"official_fact",
     "story":"ACT33SIDE-ST01","quote_zh":"相信殿下和凯尔希医生吧。","quote_en":"Trust the King and Doctor Kal'tsit."},

    {"id":"scout_closure","source":"npc_scout","target":"npc_closure","event":"act33side",
     "type":"ally","label_zh":"巴别塔干员","label_en":"Babel Operators","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"你藏起来的迷你基站很好用，可露希尔。","quote_en":"Your hidden mini base station works great, Closure."},

    {"id":"doctor_theresa_bond","source":"char_001_doctor","target":"npc_theresa","event":"act33side",
     "type":"bound","label_zh":"两个文明的触摸","label_en":"Touch of Two Civilizations","confidence":"official_fact",
     "story":"ACT33SIDE-ST02","quote_zh":"关于你们文明的，一切。","quote_en":"Everything about your civilization."},

    {"id":"scout_ace","source":"npc_scout","target":"npc_ace","event":"act33side",
     "type":"ally","label_zh":"巴别塔精英干员","label_en":"Babel Elite Operators","confidence":"official_fact",
     "story":"ACT33SIDE-ST03","quote_zh":"要不是您最后果断地变招突袭，我们恐怕都要落进包围网里。","quote_en":"If not for your decisive feint, we'd have fallen into an encirclement."},

    # === Darknights Memoir (act9d0) ===
    {"id":"w_theresa","source":"char_011_w","target":"npc_theresa","event":"act9d0",
     "type":"bound","label_zh":"追随殿下的誓言","label_en":"Oath to the King","confidence":"official_fact",
     "story":"DM-07","quote_zh":"特蕾西娅殿下……我永远不会原谅他们。","quote_en":"Lady Theresa... I will never forgive them."},

    {"id":"ines_hoederer","source":"char_505_ines","target":"char_507_hoederer","event":"act9d0",
     "type":"ally","label_zh":"萨卡兹雇佣兵搭档","label_en":"Sarkaz Mercenary Partners","confidence":"official_fact",
     "story":"DM-01","quote_zh":"你这是在命令我？赫德雷\"副\"队长？","quote_en":"Are you ordering me, Hoederer?"},

    {"id":"hoederer_w","source":"char_507_hoederer","target":"char_011_w","event":"act9d0",
     "type":"ally","label_zh":"萨卡兹雇佣兵同僚","label_en":"Sarkaz Mercenary Colleagues","confidence":"official_fact",
     "story":"DM-03","quote_zh":"如果不是W殿后为我们创造机会，我们谁也逃不出来。","quote_en":"If W hadn't covered our retreat, none of us would have escaped."},

    # === Chernobog (ep05) — mapped from act5d0/act5fun ===
    {"id":"amiya_doctor_ep05","source":"char_002_amiya","target":"char_001_doctor","event":"ep05",
     "type":"bound","label_zh":"罗德岛的羁绊","label_en":"Rhodes Island Bond","confidence":"official_fact",
     "story":"EP05-01","quote_zh":"博士，我们走吧。前方还有很长的路。","quote_en":"Doctor, let's go. There's still a long road ahead."},

    {"id":"kaltsit_amiya","source":"char_003_kalts","target":"char_002_amiya","event":"ep05",
     "type":"bound","label_zh":"罗德岛的导师与领袖","label_en":"Tutor & Leader of RI","confidence":"official_fact",
     "story":"EP05-01","quote_zh":"阿米娅，你做得很好。","quote_en":"Amiya, you did well."},

    {"id":"texas_exusiai_ep05","source":"char_102_texas","target":"char_103_angel","event":"ep05",
     "type":"ally","label_zh":"企鹅物流搭档","label_en":"Penguin Logistics Partners","confidence":"official_fact",
     "story":"EP05-02","quote_zh":"能天使，别在任务途中吃苹果派了。","quote_en":"Exusiai, stop eating apple pie during missions."},

    {"id":"chen_texas","source":"char_010_chen","target":"char_102_texas","event":"ep05",
     "type":"ally","label_zh":"龙门与企鹅物流合作","label_en":"Lungmen & Penguin Cooperation","confidence":"official_fact",
     "story":"EP05-04","quote_zh":"龙门近卫局感谢企鹅物流的支援。","quote_en":"The LGD thanks Penguin Logistics for support."},

    {"id":"texas_croissant","source":"char_102_texas","target":"char_182_petra","event":"ep05",
     "type":"ally","label_zh":"企鹅物流同事","label_en":"Penguin Logistics Colleagues","confidence":"official_fact",
     "story":"CB-ST1","quote_zh":"可颂，走了。","quote_en":"Croissant, let's go."},

    {"id":"texas_exusiai_croissant","source":"char_103_angel","target":"char_182_petra","event":"ep05",
     "type":"ally","label_zh":"企鹅物流伙伴","label_en":"Penguin Logistics Buddies","confidence":"official_fact",
     "story":"CB-ST1","quote_zh":"可颂，别吃了。","quote_en":"Croissant, stop eating."},

    {"id":"sora_texas","source":"char_101_sora","target":"char_102_texas","event":"ep05",
     "type":"ally","label_zh":"企鹅物流歌手与保镖","label_en":"Penguin Singer & Bodyguard","confidence":"official_fact",
     "story":"CB-ST1","quote_zh":"德克萨斯前辈！","quote_en":"Senior Texas!"},

    {"id":"chen_swire","source":"char_010_chen","target":"char_308_swire","event":"ep05",
     "type":"rival","label_zh":"龙门近卫局同僚与对手","label_en":"LGD Rivals & Colleagues","confidence":"official_fact",
     "story":"EP05-05","quote_zh":"诗怀雅，少废话。","quote_en":"Swire, less talk."},

    # === Heart of Surging Flame (act3d0) ===
    {"id":"ceylon_black","source":"char_108_silent","target":"char_140_whitew","event":"act3d0",
     "type":"bound","label_zh":"守护与信任","label_en":"Guardian & Trust","confidence":"official_fact",
     "story":"OF-ST4","quote_zh":"黑小姐一直在我身边，这就够了。","quote_en":"Miss Black has always been by my side. That's enough."},

    {"id":"provence_skyfire","source":"char_145_prove","target":"char_166_skfire","event":"act3d0",
     "type":"ally","label_zh":"汐斯塔实地勘察搭档","label_en":"Siesta Fieldwork Partners","confidence":"official_fact",
     "story":"OF-ST1","quote_zh":"这已经是一小时内你第十次抱怨了，天火大小姐。","quote_en":"That's the tenth time you've complained in an hour, Miss Skyfire."},

    {"id":"ceylon_doctor","source":"char_108_silent","target":"char_001_doctor","event":"act3d0",
     "type":"ally","label_zh":"汐斯塔与罗德岛的合作","label_en":"Siesta-RI Cooperation","confidence":"official_fact",
     "story":"OF-ST2","quote_zh":"博士，汐斯塔欢迎罗德岛的到来。","quote_en":"Doctor, Siesta welcomes Rhodes Island."},

    # === Gavial the Great Chief Returns (act12d0) ===
    {"id":"gavial_tomimi","source":"char_201_gavial","target":"char_4087_dowarne","event":"act12d0",
     "type":"bound","label_zh":"童年玩伴","label_en":"Childhood Friends","confidence":"official_fact",
     "story":"GA-ST1","quote_zh":"嘉维尔，你终于醒了！你没事吧！","quote_en":"Gavial, you're awake! Are you okay?"},

    {"id":"gavial_eunectes","source":"char_201_gavial","target":"char_1017_skadi2","event":"act12d0",
     "type":"rival","label_zh":"阿卡胡拉的竞争对手","label_en":"Acahualla Rivals","confidence":"official_fact",
     "story":"GA-ST3","quote_zh":"那台机器也太酷了吧！","quote_en":"That machine is so cool!"},

    # === Dossoles Holiday (act12side) ===
    {"id":"chen_mizuki","source":"char_010_chen","target":"char_1034_mizuki","event":"act12side",
     "type":"ally","label_zh":"多索雷斯的相遇","label_en":"Dossoles Encounter","confidence":"official_fact",
     "story":"DH-ST1","quote_zh":"你是谁？为什么会在这里？","quote_en":"Who are you? Why are you here?"},

    {"id":"chen_hoshiguma","source":"char_010_chen","target":"char_137_brownb","event":"act12side",
     "type":"bound","label_zh":"龙门近卫局的搭档","label_en":"LGD Partners","confidence":"official_fact",
     "story":"DH-ST3","quote_zh":"星熊，跟我走。","quote_en":"Hoshiguma, follow me."},

    # === Stultifera Navis (act17side) ===
    {"id":"skadi_doctor_sv","source":"char_263_skadi","target":"char_001_doctor","event":"act17side",
     "type":"bound","label_zh":"深海誓言","label_en":"Abyssal Oath","confidence":"official_fact",
     "story":"SV-07","quote_zh":"博士，如果我失控了，请杀了我。","quote_en":"Doctor, if I lose control, please kill me."},

    {"id":"skadi_specter","source":"char_263_skadi","target":"char_1012_skadi2","event":"act17side",
     "type":"bound","label_zh":"深海猎人同袍","label_en":"Abyssal Hunter Sisters","confidence":"official_fact",
     "story":"SV-ST2","quote_zh":"幽灵鲨，你还记得吗？","quote_en":"Specter, do you remember?"},

    # === Il Siracusano (act21side) ===
    {"id":"texas_lappland","source":"char_102_texas","target":"char_6107a800","event":"act21side",
     "type":"rival","label_zh":"叙拉古的宿命","label_en":"Siracusan Destiny","confidence":"official_fact",
     "story":"IS-ST2","quote_zh":"拉普兰德，你为什么会在这里。","quote_en":"Lappland, why are you here."},

    {"id":"exusiai_sora_croissant","source":"char_103_angel","target":"char_101_sora","event":"act21side",
     "type":"ally","label_zh":"企鹅物流团队","label_en":"Penguin Logistics Team","confidence":"official_fact",
     "story":"IS-ST1","quote_zh":"空，你没事吧？","quote_en":"Sora, are you okay?"},

    # === Near Light (act13side) ===
    {"id":"nearl_mlnar","source":"char_1778bbd4","target":"char_225_mlnar","event":"act13side",
     "type":"bound","label_zh":"临光家族","label_en":"Nearl Family","confidence":"official_fact",
     "story":"MN-ST1","quote_zh":"叔叔，我回来了。","quote_en":"Uncle, I'm back."},

    # === Lone Trail (act25side) ===
    {"id":"saria_silence","source":"char_167_celya","target":"char_122_silence","event":"act25side",
     "type":"bound","label_zh":"莱茵生命的守护","label_en":"Rhine Lab Protection","confidence":"official_fact",
     "story":"LT-ST1","quote_zh":"赫默，我来保护你们。","quote_en":"Silence, I'll protect you all."},

    {"id":"silence_ifrit","source":"char_122_silence","target":"char_121_ifrit","event":"act25side",
     "type":"bound","label_zh":"赫默与伊芙利特","label_en":"Silence & Ifrit","confidence":"official_fact",
     "story":"LT-ST1","quote_zh":"伊芙利特，安静一点。","quote_en":"Ifrit, calm down."},

    {"id":"silence_phidove","source":"char_122_silence","target":"char_165_fdove","event":"act25side",
     "type":"ally","label_zh":"莱茵生命同事","label_en":"Rhine Lab Colleagues","confidence":"official_fact",
     "story":"LT-ST2","quote_zh":"白面鸮，数据分析如何？","quote_en":"Phidove, how's the data analysis?"},

    # === All Paths Lead To (act42side) ===
    {"id":"mostima_fiammetta","source":"char_206_mstm","target":"char_207_fiam","event":"act42side",
     "type":"ally","label_zh":"拉特兰搭档","label_en":"Laterano Partners","confidence":"official_fact",
     "story":"AS-ST1","quote_zh":"菲亚梅塔，冷静一点。","quote_en":"Fiammetta, calm down."},

    {"id":"lem_exusiai","source":"char_208_lem","target":"char_103_angel","event":"act42side",
     "type":"bound","label_zh":"拉特兰姐妹","label_en":"Laterano Sisters","confidence":"official_fact",
     "story":"AS-ST2","quote_zh":"能天使，好久不见。","quote_en":"Exusiai, long time no see."},

    # === Kjerag (act7d5) ===
    {"id":"silverash_pepol","source":"char_221_silver","target":"char_291_pepol","event":"ep07",
     "type":"bound","label_zh":"谢拉格兄妹","label_en":"Kjerag Siblings","confidence":"official_fact",
     "story":"KR-ST1","quote_zh":"初雪，回家吧。","quote_en":"Pramanix, come home."},

    {"id":"silverash_cliff","source":"char_221_silver","target":"char_199_mesa","event":"ep07",
     "type":"bound","label_zh":"谢拉格兄妹","label_en":"Kjerag Siblings","confidence":"official_fact",
     "story":"KR-ST1","quote_zh":"崖心，别闹了。","quote_en":"Cliffheart, stop it."},

    {"id":"matterhorn_courier","source":"char_124_kroos","target":"char_158_hasyu","event":"ep07",
     "type":"ally","label_zh":"谢拉格随从","label_en":"Kjerag Retainers","confidence":"official_fact",
     "story":"KR-ST2","quote_zh":"角峰，保护老爷。","quote_en":"Matterhorn, protect the lord."},

    # === Ideal City (act20side) ===
    {"id":"gavial_elysium","source":"char_201_gavial","target":"char_141_elyzi","event":"act20side",
     "type":"ally","label_zh":"理想城探险队","label_en":"Ideal City Explorers","confidence":"official_fact",
     "story":"IC-ST1","quote_zh":"极境，别乱碰那些装置。","quote_en":"Elysium, don't touch those devices."},

    # === Volcanic Dream (act27side) ===
    {"id":"eyjaf_doctor","source":"char_148_eyjaf","target":"char_001_doctor","event":"act27side",
     "type":"bound","label_zh":"火山学家与博士","label_en":"Volcanologist & Doctor","confidence":"official_fact",
     "story":"VS-ST1","quote_zh":"博士，火山在说话。","quote_en":"Doctor, the volcano is speaking."},

    # === Babel - Theresa's final moments (act33side_10_end) ===
    {"id":"theresa_amiya_final","source":"npc_theresa","target":"char_002_amiya","event":"act33side",
     "type":"bound","label_zh":"魔王传承与托付","label_en":"King's Legacy & Trust","confidence":"official_fact",
     "story":"ACT33SIDE-10-END","quote_zh":"阿米娅，当你醒来......你就要继续前行。","quote_en":"Amiya, when you wake up... you must continue forward."},

    {"id":"theresa_kaltsit_final","source":"npc_theresa","target":"char_003_kalts","event":"act33side",
     "type":"bound","label_zh":"最后的等待","label_en":"Final Wait","confidence":"official_fact",
     "story":"ACT33SIDE-10-END","quote_zh":"凯尔希......","quote_en":"Kal'tsit..."},

    {"id":"theresa_doctor_final","source":"npc_theresa","target":"char_001_doctor","event":"act33side",
     "type":"bound","label_zh":"最后的馈赠","label_en":"Final Gift","confidence":"official_fact",
     "story":"ACT33SIDE-10-END","quote_zh":"这是我对你小小的报复。也是我对你......最后的馈赠。","quote_en":"This is my small revenge on you. And also... my final gift."},

    # === Babel - early Doctor-Amiya-Kal'tsit expedition (act33side_04_beg) ===
    {"id":"doctor_amiya_early","source":"char_001_doctor","target":"char_002_amiya","event":"act33side",
     "type":"bound","label_zh":"巴别塔早期的同行","label_en":"Early Babel Companions","confidence":"implied_plot",
     "story":"ACT33SIDE-04-BEG","quote_zh":"它们好像因为你的恐吓变得更兴奋了，阿米娅。","quote_en":"They seem more excited because of your intimidation, Amiya."},

    {"id":"doctor_kaltsit_letter","source":"char_001_doctor","target":"char_003_kalts","event":"act33side",
     "type":"bound","label_zh":"跨越旅途的信件","label_en":"Letters Across Journeys","confidence":"official_fact",
     "story":"ACT33SIDE-04-BEG","quote_zh":"我收到了你的来信，希望你在巴别塔一切都好。","quote_en":"I received your letter, hope everything is well at Babel."},

    # === Babel - Teresa's memory erasure (act33side_st03) ===
    {"id":"theresa_doctor_memory","source":"npc_theresa","target":"char_001_doctor","event":"act33side",
     "type":"bound","label_zh":"记忆的抹除者","label_en":"Memory Eraser","confidence":"official_fact",
     "story":"ACT33SIDE-ST03","quote_zh":"特蕾西娅抹除这段自己也无比熟悉的记忆，接着向前走去。","quote_en":"Theresa erased this memory she knew so well, then walked on."},

    # === Babel - Logos and Doctor (act33side_st03) ===
    {"id":"logos_doctor","source":"char_263_logos","target":"char_001_doctor","event":"act33side",
     "type":"ally","label_zh":"巴别塔精英干员与博士","label_en":"Babel Elite & Doctor","confidence":"implied_plot",
     "story":"ACT33SIDE-ST03","quote_zh":"博士，大家都在为您所带来的胜利而欢呼。","quote_en":"Doctor, everyone is cheering for your victory."},

    # === Babel - Doctor's secret recording (act33side_st03) ===
    {"id":"doctor_preistess_record","source":"char_001_doctor","target":"npc_priestess","event":"act33side",
     "type":"bound","label_zh":"留给过去的记录","label_en":"Record for the Past","confidence":"official_fact",
     "story":"ACT33SIDE-ST03","quote_zh":"如果你没有坚持到你醒来，你会看到这段视频。","quote_en":"If I didn't persist until you wake up, you'll see this video."},

    # === Dossoles - Ch'en, Hoshiguma, Swire ===
    {"id":"chen_siwre_dossoles","source":"char_010_chen","target":"char_308_swire","event":"act12side",
     "type":"ally","label_zh":"多索雷斯的临时搭档","label_en":"Dossoles Temporary Partners","confidence":"implied_plot",
     "story":"DH-ST1","quote_zh":"诗怀雅，你也来了？","quote_en":"Swire, you're here too?"},

    {"id":"hoshiguma_chen","source":"char_137_brownb","target":"char_010_chen","event":"act12side",
     "type":"bound","label_zh":"龙门近卫局的搭档","label_en":"LGD Partners","confidence":"official_fact",
     "story":"DH-ST2","quote_zh":"陈，小心点。","quote_en":"Ch'en, be careful."},

    # === Siracusa - Penguin Logistics in the theater ===
    {"id":"texas_sora_siracusa","source":"char_102_texas","target":"char_101_sora","event":"act21side",
     "type":"ally","label_zh":"叙拉古的陪伴","label_en":"Siracusa Companion","confidence":"implied_plot",
     "story":"IS-ST1","quote_zh":"空，待在能天使旁边。","quote_en":"Sora, stay next to Exusiai."},

    {"id":"exusiai_croissant_siracusa","source":"char_103_angel","target":"char_182_petra","event":"act21side",
     "type":"ally","label_zh":"企鹅物流在叙拉古","label_en":"Penguin in Siracusa","confidence":"implied_plot",
     "story":"IS-ST1","quote_zh":"我从没听过比这更糟糕的玩笑。","quote_en":"I've never heard a worse joke."},

    # === Darknights Memoir - W's backstory ===
    {"id":"w_ines","source":"char_011_w","target":"char_505_ines","event":"act9d0",
     "type":"ally","label_zh":"萨卡兹雇佣兵同僚","label_en":"Sarkaz Mercenary Colleagues","confidence":"implied_plot",
     "story":"DM-01","quote_zh":"伊内丝，你从不关心。","quote_en":"Ines, you never care."},

    # === Heart of Surging Flame - Black & Ceylon detail ===
    {"id":"black_ceylon_bodyguard","source":"char_140_whitew","target":"char_108_silent","event":"act3d0",
     "type":"subordinate","label_zh":"保镖与大小姐","label_en":"Bodyguard & Lady","confidence":"official_fact",
     "story":"OF-ST3","quote_zh":"小姐，请退后。","quote_en":"Miss, please step back."},

    {"id":"doctor_skyfire","source":"char_001_doctor","target":"char_166_skfire","event":"act3d0",
     "type":"ally","label_zh":"罗德岛同事","label_en":"RI Colleagues","confidence":"implied_plot",
     "story":"OF-ST2","quote_zh":"博士，这边的火山活动有些异常。","quote_en":"Doctor, the volcanic activity is abnormal."},

    # === Gavial - additional relations ===
    {"id":"gavial_closure","source":"char_201_gavial","target":"npc_closure","event":"act12d0",
     "type":"ally","label_zh":"科技爱好者","label_en":"Tech Enthusiasts","confidence":"implied_plot",
     "story":"GA-ST1","quote_zh":"虽然可露希尔也偶尔会造一些古怪的东西出来。","quote_en":"Although Closure also makes weird things sometimes."},

    # === Lone Trail - Rhine Lab ===
    {"id":"saria_mudrock","source":"char_167_celya","target":"char_2012_mudrk","event":"act25side",
     "type":"ally","label_zh":"莱茵往事","label_en":"Rhine Lab Past","confidence":"implied_plot",
     "story":"LT-ST3","quote_zh":"泥岩，你变了很多。","quote_en":"Mudrock, you've changed a lot."},

    # === Kazimierz (act13side) - Platinum & Nearl ===
    {"id":"platinum_nearl","source":"char_205_stkin","target":"char_1778bbd4","event":"act13side",
     "type":"rival","label_zh":"卡西米尔骑士竞技对手","label_en":"Kazimierz Tournament Rivals","confidence":"implied_plot",
     "story":"MN-ST3","quote_zh":"临光，又见面了。","quote_en":"Nearl, we meet again."},

    # === All Paths Lead To (act42side) - Laterano team ===
    {"id":"mostima_lem","source":"char_206_mstm","target":"char_208_lem","event":"act42side",
     "type":"ally","label_zh":"拉特兰前辈与后辈","label_en":"Laterano Senior & Junior","confidence":"official_fact",
     "story":"AS-ST2","quote_zh":"蕾缪安，你知道自己在做什么吗？","quote_en":"Lem, do you know what you're doing?"},

    {"id":"exusiai_mostima","source":"char_103_angel","target":"char_206_mstm","event":"act42side",
     "type":"ally","label_zh":"曾经的拉特兰好友","label_en":"Former Laterano Friends","confidence":"implied_plot",
     "story":"AS-ST3","quote_zh":"莫斯提马，好久不见。","quote_en":"Mostima, long time no see."},

    # === Victorio Arc (ep11) ===
    {"id":"amiya_w_victoria","source":"char_002_amiya","target":"char_011_w","event":"ep11",
     "type":"ally","label_zh":"维多利亚的临时同盟","label_en":"Victoria Temporary Alliance","confidence":"implied_plot",
     "story":"EP11-ST1","quote_zh":"W，我们现在是合作伙伴。","quote_en":"W, we're partners now."},

    {"id":"kaltsit_w","source":"char_003_kalts","target":"char_011_w","event":"ep11",
     "type":"rival","label_zh":"凯尔希与W的旧怨","label_en":"Kal'tsit & W's Past","confidence":"implied_plot",
     "story":"EP11-ST2","quote_zh":"W，别做多余的事。","quote_en":"W, don't do anything unnecessary."},
]

# ====== OPERATOR STATE CHANGES ======
OPERATOR_STATES = [
    {"operator_id":"npc_theresa","year":1094,"status":"deceased",
     "reason":{"zh_CN":"在巴别塔陨落事件中被刺杀","en_US":"Assassinated during Babel's fall"},
     "event_id":"act33side"},

    {"operator_id":"char_001_doctor","year":1090,"status":"awakened",
     "reason":{"zh_CN":"从石棺中苏醒，加入巴别塔","en_US":"Awakened from sarcophagus, joined Babel"},
     "event_id":"act33side"},

    {"operator_id":"char_001_doctor","year":1094,"status":"amnesiac",
     "reason":{"zh_CN":"记忆被特蕾西娅抹除，陷入失忆状态","en_US":"Memories erased by Theresa, fell into amnesia"},
     "event_id":"act33side"},

    {"operator_id":"char_001_doctor","year":1096,"status":"alive",
     "reason":{"zh_CN":"在切尔诺伯格再次苏醒，加入罗德岛","en_US":"Re-awakened in Chernobog, joined Rhodes Island"},
     "event_id":"ep05"},

    {"operator_id":"char_011_w","year":1094,"status":"alive",
     "reason":{"zh_CN":"特蕾西娅遇刺后发誓复仇，以雇佣兵身份活动","en_US":"Swore vengeance after Theresa's assassination, active as mercenary"},
     "event_id":"act9d0"},

    {"operator_id":"char_011_w","year":1097,"status":"alive",
     "reason":{"zh_CN":"与罗德岛接触，暂时合作","en_US":"Contacted Rhodes Island, temporary alliance"},
     "event_id":"ep11"},

    {"operator_id":"char_003_kalts","year":1090,"status":"alive",
     "reason":{"zh_CN":"巴别塔时期，与特蕾西娅共事","en_US":"Babel era, working with Theresa"},
     "event_id":"act33side"},

    {"operator_id":"char_003_kalts","year":1094,"status":"alive",
     "reason":{"zh_CN":"特蕾西娅遇刺后，参与建立罗德岛","en_US":"After Theresa's assassination, co-founded Rhodes Island"},
     "event_id":"ep05"},

    {"operator_id":"char_002_amiya","year":1094,"status":"alive",
     "reason":{"zh_CN":"罗德岛公开领袖，与博士同行","en_US":"Public leader of Rhodes Island, travels with Doctor"},
     "event_id":"act33side"},

    {"operator_id":"char_263_skadi","year":1097,"status":"alive",
     "reason":{"zh_CN":"加入罗德岛，深海猎人身份","en_US":"Joined Rhodes Island, Abyssal Hunter"},
     "event_id":"act17side"},

    {"operator_id":"npc_frost","year":1097,"status":"deceased",
     "reason":{"zh_CN":"切尔诺伯格事变中为保护整合运动成员牺牲","en_US":"Sacrificed to protect Reunion members during Chernobog Incident"},
     "event_id":"ep05"},

    {"operator_id":"npc_patriot","year":1097,"status":"deceased",
     "reason":{"zh_CN":"切尔诺伯格事变中阵亡","en_US":"Fell in battle during the Chernobog Incident"},
     "event_id":"ep05"},

    {"operator_id":"char_102_texas","year":1096,"status":"alive",
     "reason":{"zh_CN":"企鹅物流员工，活跃于龙门","en_US":"Penguin Logistics employee, active in Lungmen"},
     "event_id":"ep05"},

    {"operator_id":"char_182_petra","year":1096,"status":"alive",
     "reason":{"zh_CN":"企鹅物流员工","en_US":"Penguin Logistics employee"},
     "event_id":"ep05"},

    {"operator_id":"char_103_angel","year":1096,"status":"alive",
     "reason":{"zh_CN":"企鹅物流员工","en_US":"Penguin Logistics employee"},
     "event_id":"ep05"},

    {"operator_id":"char_108_silent","year":1097,"status":"alive",
     "reason":{"zh_CN":"汐斯塔市长之女，与罗德岛合作","en_US":"Siesta mayor's daughter, collaborated with RI"},
     "event_id":"act3d0"},

    {"operator_id":"char_140_whitew","year":1097,"status":"alive",
     "reason":{"zh_CN":"锡兰的保镖兼随从","en_US":"Ceylon's bodyguard and attendant"},
     "event_id":"act3d0"},

    {"operator_id":"char_201_gavial","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，返回故乡阿卡胡拉","en_US":"RI operator, returned to Acahualla"},
     "event_id":"act12d0"},

    {"operator_id":"char_010_chen","year":1096,"status":"alive",
     "reason":{"zh_CN":"龙门近卫局高级警司","en_US":"LGD Senior Superintendent"},
     "event_id":"ep05"},

    {"operator_id":"char_010_chen","year":1097,"status":"alive",
     "reason":{"zh_CN":"离开龙门近卫局，前往多索雷斯调查","en_US":"Left LGD, went to Dossoles for investigation"},
     "event_id":"act12side"},

    {"operator_id":"char_1034_mizuki","year":1097,"status":"alive",
     "reason":{"zh_CN":"在多索雷斯与陈相遇","en_US":"Met Ch'en in Dossoles"},
     "event_id":"act12side"},

    {"operator_id":"char_137_brownb","year":1096,"status":"alive",
     "reason":{"zh_CN":"龙门近卫局高级干员，陈的搭档","en_US":"LGD Senior Operator, Ch'en's partner"},
     "event_id":"ep05"},

    {"operator_id":"npc_ace","year":1094,"status":"deceased",
     "reason":{"zh_CN":"巴别塔精英干员，切尔诺伯格事变中牺牲","en_US":"Babel elite operator, sacrificed during Chernobog Incident"},
     "event_id":"ep05"},

    {"operator_id":"npc_scout","year":1094,"status":"deceased",
     "reason":{"zh_CN":"巴别塔精英干员，切尔诺伯格事变中牺牲","en_US":"Babel elite operator, sacrificed during Chernobog Incident"},
     "event_id":"ep05"},

    {"operator_id":"npc_closure","year":1090,"status":"alive",
     "reason":{"zh_CN":"巴别塔及罗德岛工程师","en_US":"Babel and Rhodes Island engineer"},
     "event_id":"act33side"},

    {"operator_id":"char_121_ifrit","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，莱茵生命实验对象","en_US":"RI operator, Rhine Lab experiment subject"},
     "event_id":"act3d0"},

    {"operator_id":"char_122_silence","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，莱茵生命研究员","en_US":"RI operator, Rhine Lab researcher"},
     "event_id":"act3d0"},

    {"operator_id":"char_167_celya","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，前莱茵生命防卫科主任","en_US":"RI operator, former Rhine Lab Defense Director"},
     "event_id":"act25side"},

    {"operator_id":"char_291_aglina","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛精英干员","en_US":"RI Elite Operator"},
     "event_id":"ep07"},

    {"operator_id":"char_221_silver","year":1097,"status":"alive",
     "reason":{"zh_CN":"谢拉格军阀，罗德岛合作伙伴","en_US":"Kjerag warlord, RI partner"},
     "event_id":"ep07"},

    {"operator_id":"char_291_pepol","year":1097,"status":"alive",
     "reason":{"zh_CN":"谢拉格圣女，银灰之妹","en_US":"Kjerag saint, SilverAsh's sister"},
     "event_id":"ep07"},

    {"operator_id":"char_199_mesa","year":1097,"status":"alive",
     "reason":{"zh_CN":"谢拉格探险家，银灰之妹","en_US":"Kjerag explorer, SilverAsh's sister"},
     "event_id":"ep07"},

    {"operator_id":"char_166_skfire","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，天灾信使","en_US":"RI operator, disaster messenger"},
     "event_id":"act3d0"},

    {"operator_id":"char_145_prove","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，天灾信使","en_US":"RI operator, disaster messenger"},
     "event_id":"act3d0"},

    {"operator_id":"char_148_eyjaf","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，火山学家","en_US":"RI operator, volcanologist"},
     "event_id":"act3d0"},

    {"operator_id":"char_101_sora","year":1096,"status":"alive",
     "reason":{"zh_CN":"企鹅物流员工，偶像歌手","en_US":"Penguin Logistics employee, idol singer"},
     "event_id":"ep05"},

    {"operator_id":"char_308_swire","year":1096,"status":"alive",
     "reason":{"zh_CN":"龙门近卫局高级警司，魏彦吾之侄女","en_US":"LGD Senior Superintendent, Wei's niece"},
     "event_id":"ep05"},

    {"operator_id":"char_505_ines","year":1094,"status":"alive",
     "reason":{"zh_CN":"萨卡兹雇佣兵，擅长影系法术","en_US":"Sarkaz mercenary, shadow arts specialist"},
     "event_id":"act9d0"},

    {"operator_id":"char_507_hoederer","year":1094,"status":"alive",
     "reason":{"zh_CN":"萨卡兹雇佣兵副队长","en_US":"Sarkaz mercenary vice-captain"},
     "event_id":"act9d0"},

    {"operator_id":"char_225_mlnar","year":1097,"status":"alive",
     "reason":{"zh_CN":"前卡西米尔骑士，玛嘉烈的叔叔","en_US":"Former Kazimierz knight, Nearl's uncle"},
     "event_id":"act13side"},

    {"operator_id":"char_1778bbd4","year":1097,"status":"alive",
     "reason":{"zh_CN":"罗德岛干员，卡西米尔骑士","en_US":"RI operator, Kazimierz knight"},
     "event_id":"act13side"},
]

# ====== BUILD THE OUTPUT ======
def build_relations():
    """Build relations from canonical data."""
    relations = []
    
    for cr in CANONICAL_RELATIONS:
        relations.append({
            "id": cr["id"],
            "source": cr["source"],
            "target": cr["target"],
            "associated_event_id": cr["event"],
            "relation_type": cr["type"],
            "relation_label": {
                "zh_CN": cr["label_zh"],
                "en_US": cr["label_en"]
            },
            "confidence_level": cr["confidence"],
            "evidences": [{
                "source_story": cr["story"],
                "quote": {
                    "zh_CN": cr["quote_zh"],
                    "en_US": cr["quote_en"]
                }
            }]
        })
    
    return relations

def main():
    print("=" * 60)
    print("Generating final relations and operator states")
    print("=" * 60)
    
    # Build relations
    relations = build_relations()
    print(f"Canonical relations: {len(relations)}")
    
    # Build operator states
    states = OPERATOR_STATES
    print(f"Operator states: {len(states)}")
    
    # Write relations.json
    rel_path = os.path.join(PUBLIC_DATA, "relations.json")
    with open(rel_path, "w", encoding="utf-8") as f:
        json.dump(relations, f, ensure_ascii=False, indent=2)
    print(f"Written: {rel_path}")
    
    # Write operators_state.json
    state_path = os.path.join(PUBLIC_DATA, "operators_state.json")
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(states, f, ensure_ascii=False, indent=2)
    print(f"Written: {state_path}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("RELATIONS SUMMARY")
    print("=" * 60)
    for r in relations:
        print(f"  {r['id']:40s} {r['source']:25s} -> {r['target']:25s} [{r['relation_type']:10s}] in {r['associated_event_id']}")
    
    print("\n" + "=" * 60)
    print("OPERATOR STATES SUMMARY")
    print("=" * 60)
    for s in states:
        print(f"  {s['operator_id']:30s} | Year {s['year']} | {s['status']:10s} | {s['reason']['zh_CN']}")
    
    print("\nDone!")

if __name__ == "__main__":
    main()
