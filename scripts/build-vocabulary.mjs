import fs from "node:fs";
import path from "node:path";

const source = process.argv[2] ?? "/Users/lixinyi/Developer/Tuanshan/simplified_chinese_800.csv";
const outFile = path.resolve("src/data/vocabulary.ts");

const glossary = makeGlossary(`
我=I
你=you
您=you, polite
他=he
她=she
它=it
我们=we
你们=you, plural
他们=they
自己=oneself
大家=everyone
别人=other people
这=this
那=that
谁=who
什么=what
哪=which
哪儿=where
一=one
二=two
三=three
四=four
五=five
六=six
七=seven
八=eight
九=nine
十=ten
百=hundred
千=thousand
万=ten thousand
亿=hundred million
零=zero
两=two
半=half
是=to be
有=to have
在=to be at
叫=to be called
姓=surname; to be surnamed
住=to live
出生=to be born
长大=to grow up
来自=to come from
名字=name
人=person
国家=country
国籍=nationality
家乡=hometown
老家=hometown
护照=passport
签证=visa
身份证=ID card
外国人=foreigner
中国人=Chinese person
欧洲人=European person
美国人=American person
华人=person of Chinese heritage
移民=immigrant
游客=tourist
留学生=international student
身份=identity
旅游=to travel
旅行=to travel
出国=to go abroad
回国=to return to one's country
搬家=to move house
定居=to settle
爸爸=dad
妈妈=mom
爷爷=paternal grandfather
奶奶=paternal grandmother
外公=maternal grandfather
外婆=maternal grandmother
哥哥=older brother
姐姐=older sister
弟弟=younger brother
妹妹=younger sister
儿子=son
女儿=daughter
丈夫=husband
妻子=wife
老公=husband
老婆=wife
家人=family member
家庭=family
亲戚=relative
叔叔=uncle
阿姨=aunt
大人=adult
小孩=child
宝宝=baby
夫妻=married couple
老人=elderly person
年轻人=young person
邻居=neighbor
同学=classmate
同事=colleague
老师=teacher
领导=leader
老板=boss
朋友=friend
男朋友=boyfriend
女朋友=girlfriend
爱=to love
喜欢=to like
照顾=to take care of
关心=to care about
结婚=to marry
离婚=to divorce
认识=to know; to meet
帮忙=to help
陪=to accompany
想念=to miss
亲=close; dear
熟=familiar
年轻=young
可爱=cute
好=good
单身=single
头=head
脸=face
眼睛=eyes
鼻子=nose
嘴=mouth
耳朵=ear
牙=tooth
舌头=tongue
脖子=neck
肩膀=shoulder
手=hand
手指=finger
胳膊=arm
腿=leg
脚=foot
肚子=belly
背=back
腰=waist
心=heart
皮肤=skin
头发=hair
血=blood
骨头=bone
身体=body
个子=height; build
力气=strength
病=illness
感冒=cold
药=medicine
医院=hospital
医生=doctor
护士=nurse
精神=energy; spirit
命=life
气=air; anger
汗=sweat
病人=patient
体检=physical exam
口罩=mask
睡=to sleep
醒=to wake up
休息=to rest
生病=to get sick
看病=to see a doctor
咳嗽=to cough
发烧=to have a fever
受伤=to get injured
洗澡=to bathe
刷牙=to brush teeth
运动=to exercise; sport
锻炼=to exercise
长=long; to grow
健身=to work out
疼=to hurt
累=tired
困=sleepy
饿=hungry
渴=thirsty
饱=full
舒服=comfortable
健康=healthy
胖=fat
瘦=thin
高=tall; high
矮=short
壮=strong
难受=uncomfortable
饭=meal; cooked rice
米饭=rice
面=noodles; flour
面条=noodles
菜=dish; vegetable
肉=meat
鱼=fish
鸡=chicken
鸡蛋=egg
猪肉=pork
牛肉=beef
羊肉=lamb
虾=shrimp
青菜=greens
蔬菜=vegetables
水果=fruit
苹果=apple
香蕉=banana
橘子=orange
西瓜=watermelon
葡萄=grape
汤=soup
粥=porridge
包子=steamed bun
饺子=dumpling
馒头=steamed bun
面包=bread
蛋糕=cake
糖=sugar; candy
盐=salt
油=oil
酱油=soy sauce
醋=vinegar
水=water
茶=tea
咖啡=coffee
牛奶=milk
果汁=juice
酒=alcohol
啤酒=beer
饮料=drink
味道=taste
早餐=breakfast
午餐=lunch
晚餐=dinner
零食=snack
餐厅=restaurant
饭店=restaurant; hotel
食堂=cafeteria
厨房=kitchen
外卖=takeout
吃=to eat
喝=to drink
尝=to taste
做饭=to cook
煮=to boil; to cook
炒=to stir-fry
蒸=to steam
烤=to roast; to bake
切=to cut
点=to order; point
请客=to treat someone
甜=sweet
咸=salty
辣=spicy
酸=sour
苦=bitter
香=fragrant
好吃=tasty
新鲜=fresh
烫=hot to the touch
家=home; family
房子=house
房间=room
屋子=room; house
门=door
窗户=window
墙=wall
楼=building; floor
楼梯=stairs
客厅=living room
卧室=bedroom
厕所=toilet
卫生间=bathroom
床=bed
桌子=table
椅子=chair
沙发=sofa
柜子=cabinet
灯=lamp
电视=television
冰箱=refrigerator
空调=air conditioner
洗衣机=washing machine
钟=clock
表=watch; meter
镜子=mirror
毛巾=towel
牙刷=toothbrush
肥皂=soap
被子=quilt
枕头=pillow
刀=knife
勺子=spoon
筷子=chopsticks
盘子=plate
杯子=cup
瓶子=bottle
锅=pot
垃圾=trash
纸=paper
笔=pen
书=book
钥匙=key
锁=lock
电脑=computer
手机=mobile phone
充电器=charger
插座=socket
用=to use
放=to put
拿=to take
收拾=to tidy up
打扫=to clean
扫=to sweep
擦=to wipe
洗=to wash
修=to repair
开=to open; to drive
关=to close
搬=to move
丢=to lose; to throw away
找=to look for
干净=clean
脏=dirty
乱=messy
整齐=neat
新=new
旧=old
空=empty
满=full
亮=bright
暗=dark
软=soft
硬=hard
衣服=clothes
裤子=pants
裙子=skirt
鞋=shoes
袜子=socks
帽子=hat
手套=gloves
围巾=scarf
外套=coat
毛衣=sweater
衬衫=shirt
包=bag
书包=schoolbag
钱包=wallet
伞=umbrella
颜色=color
造型=style; look
穿=to wear
戴=to wear; to put on
脱=to take off
换=to change
试=to try
化妆=to put on makeup
漂亮=pretty
美=beautiful
丑=ugly
好看=good-looking
短=short
大=big
小=small
宽=wide
窄=narrow
厚=thick
薄=thin
红色=red
黄色=yellow
蓝色=blue
绿色=green
黑色=black
白色=white
灰色=gray
紫色=purple
粉色=pink
年=year
月=month
日=day
天=day
星期=week
周=week
小时=hour
分钟=minute
秒=second
岁=years old
早上=early morning
上午=morning
中午=noon
下午=afternoon
晚上=evening
夜=night
白天=daytime
今天=today
明天=tomorrow
昨天=yesterday
后天=day after tomorrow
前天=day before yesterday
现在=now
刚才=just now
以前=before
以后=after; later
最近=recently
时候=time; moment
时间=time
日子=day; life
季节=season
春=spring
夏=summer
秋=autumn
冬=winter
周末=weekend
假期=holiday
生日=birthday
节日=festival
平时=usually
当时=at that time
未来=future
过去=past
等=to wait
迟到=to be late
开始=to begin
结束=to end
起床=to get up
出发=to set off
来得及=to have enough time
早=early
晚=late
快=fast
慢=slow
忙=busy
闲=free
久=a long time
学校=school
教室=classroom
办公室=office
图书馆=library
课=class
作业=homework
考试=exam
成绩=grade
字=character
词=word
句子=sentence
文章=article
知识=knowledge
专业=major; profession
笔记=notes
公司=company
单位=work unit
工作=work; job
工作室=studio
项目=project
会议=meeting
任务=task
计划=plan
经验=experience
技术=technology; skill
能力=ability
面试=interview
简历=resume
实习=internship
培训=training
收入=income
创业=start a business
同行=peer; same industry
网络=network; internet
网上=online
网站=website
软件=software
视频=video
邮件=email
文件=file
消息=message
密码=password
账号=account
流量=data; traffic
平板=tablet
耳机=headphones
微信=WeChat
APP=app
表情包=sticker pack
直播=live stream
博主=blogger
粉丝=fan; follower
视频通话=video call
点赞=to like
关注=to follow
分享=to share
学=to learn
教=to teach
读=to read
写=to write
问=to ask
答=to answer
考=to test
记=to remember; to note
算=to calculate
查=to look up
练=to practice
复习=to review
上课=to attend class
上班=to go to work
下班=to get off work
毕业=to graduate
努力=to work hard
完成=to complete
负责=to be responsible for
参加=to participate
上网=to go online
注册=to register
下载=to download
打印=to print
本=classifier
节=classifier
难=difficult
容易=easy
简单=simple
复杂=complex
重要=important
认真=serious; careful
聪明=smart
清楚=clear
车=vehicle
汽车=car
出租车=taxi
网约车=ride-hailing car
公交车=bus
火车=train
高铁=high-speed rail
飞机=airplane
自行车=bicycle
共享单车=shared bike
电动车=electric bike
摩托车=motorcycle
地铁=subway
船=boat
票=ticket
车站=station
机场=airport
路=road
马路=road
桥=bridge
酒店=hotel
地图=map
导航=navigation
城市=city
农村=countryside
村=village
街=street
公园=park
广场=square
方向=direction
红绿灯=traffic light
停车场=parking lot
加油站=gas station
上=up; on
下=down; under
前=front; before
后=back; after
左=left
右=right
里=inside
外=outside
中=middle
旁边=beside
对面=opposite
附近=nearby
东=east
南=south
西=west
北=north
走=to walk
跑=to run
来=to come
去=to go
到=to arrive
回=to return
进=to enter
出=to exit
坐=to sit; to ride
骑=to ride
开车=to drive
停=to stop
离开=to leave
带=to bring
打车=to take a taxi
商店=shop
超市=supermarket
市场=market
银行=bank
钱=money
价格=price
工资=salary
生意=business
产品=product
顾客=customer
快递=delivery
网购=online shopping
现金=cash
银行卡=bank card
红包=red envelope
余额=balance
优惠=discount
订单=order
发票=invoice
网店=online shop
店员=shop assistant
元=yuan
块=colloquial yuan
毛=jiao; dime
斤=jin, 500 grams
公斤=kilogram
米=meter; rice
买=to buy
卖=to sell
付=to pay
花=to spend; flower
省=to save; province
存=to save; to deposit
借=to borrow
还=to return; still
退=to return; refund
挑=to choose
选=to choose
打折=to discount
扫码=to scan a code
付款=to pay
下单=to place an order
转账=to transfer money
刷卡=to swipe a card
支付=to pay
贵=expensive
便宜=cheap
值=to be worth
富=rich
穷=poor
免费=free of charge
多少钱=how much money
阳光=sunlight
天空=sky
太阳=sun
月亮=moon
星星=star
云=cloud
风=wind
雨=rain
雪=snow
雷=thunder
天气=weather
气温=air temperature
温度=temperature
空气=air
火=fire
光=light
河=river
海=sea
湖=lake
山=mountain
石头=stone
土=soil
树=tree
草=grass
花=flower
叶子=leaf
森林=forest
地=ground; place
环境=environment
地球=Earth
世界=world
狗=dog
猫=cat
鸟=bird
猪=pig
牛=cow
羊=sheep
马=horse
兔子=rabbit
老鼠=mouse
虫=bug
蛇=snake
宠物=pet
刮=to blow; to scrape
流=to flow
吹=to blow
冷=cold
热=hot
暖=warm
凉=cool
晴=sunny
阴=cloudy
干=dry
湿=wet
心情=mood
感情=feeling
爱情=love
友谊=friendship
脾气=temper
性格=personality
习惯=habit
态度=attitude
想法=idea
意思=meaning
新闻=news
原因=reason
结果=result
希望=hope
梦=dream
关系=relationship
社会=society
政府=government
人民=people
声音=sound; voice
机会=opportunity
办法=method; solution
信心=confidence
压力=pressure
感觉=feeling
印象=impression
误会=misunderstanding
说=to say
讲=to speak
谈=to talk
聊=to chat
告诉=to tell
回答=to answer
解释=to explain
介绍=to introduce
商量=to discuss
讨论=to discuss
决定=to decide
想=to think; to want
觉得=to feel; to think
知道=to know
明白=to understand
懂=to understand
了解=to understand
相信=to believe
记得=to remember
忘=to forget
担心=to worry
害怕=to be afraid
怕=to fear
生气=to get angry
哭=to cry
笑=to laugh
感谢=to thank
道歉=to apologize
同意=to agree
反对=to oppose
骂=to scold
夸=to praise
劝=to advise
祝=to wish
高兴=happy
开心=happy
快乐=happy
难过=sad
伤心=sad
紧张=nervous
奇怪=strange
特别=special
普通=ordinary
安静=quiet
热闹=lively
`);

const traditionalMap = makeCharMap(`
们們 这這 哪哪 儿兒 个個 么麼 国國 乡鄉 护護 证證 华華 游遊 学學 身身 份份 亲親 戚戚 领导領導 爱愛 欢歡 顾顧 关關 结結 离離 识識 帮幫 陪陪 想想 念念 年年 轻輕 单單 头頭 脸臉 眼眼 鼻鼻 嘴嘴 耳耳 朵朵 牙牙 舌舌 脖脖 肩肩 膀膀 胳胳 膊膊 腿腿 脚腳 肚肚 背背 腰腰 心心 皮皮 肤膚 发髮 血血 骨骨 体體 个個 力力 气氣 病病 感感 冒冒 药藥 医醫 院院 护護 士士 精精 神神 命命 汗汗 检檢 罩罩 睡睡 醒醒 休休 息息 咳咳 嗽嗽 烧燒 伤傷 洗洗 澡澡 刷刷 运運 动動 锻鍛 炼煉 长長 健健 疼疼 累累 困困 饿餓 渴渴 饱飽 舒舒 服服 康康 胖胖 瘦瘦 高高 矮矮 壮壯 难難 受受 饭飯 面麵 条條 菜菜 肉肉 鱼魚 鸡雞 蛋蛋 猪豬 牛牛 羊羊 虾蝦 青青 蔬蔬 果果 苹蘋 桔橘 汤湯 粥粥 包包 饺餃 馒饅 头頭 糖糖 盐鹽 油油 酱醬 醋醋 水水 茶茶 啡啡 奶奶 饮飲 料料 餐餐 厅廳 饭飯 店店 厨廚 房房 卖賣 吃吃 喝喝 尝嘗 做做 煮煮 炒炒 蒸蒸 烤烤 切切 点點 请請 客客 杯杯 碗碗 盘盤 瓶瓶 份份 片片 口口 顿頓 甜甜 咸鹹 辣辣 酸酸 苦苦 香香 鲜鮮 烫燙 家家 房房 间間 屋屋 门門 窗窗 墙牆 楼樓 梯梯 客客 厅廳 卧臥 室室 厕廁 卫衛 生生 床床 桌桌 椅椅 沙沙 发發 柜櫃 灯燈 视視 冰冰 箱箱 调調 衣衣 机機 钟鐘 表表 镜鏡 巾巾 刀刀 勺勺 筷筷 锅鍋 垃垃 圾圾 纸紙 笔筆 书書 钥鑰 匙匙 锁鎖 脑腦 机機 充充 电電 器器 插插 座座 用用 放放 拿拿 收收 拾拾 扫掃 擦擦 修修 开開 关關 搬搬 丢丟 找找 张張 把把 件件 台臺 部部 净淨 脏髒 乱亂 齐齊 旧舊 空空 满滿 亮亮 暗暗 软軟 硬硬 裤褲 裙裙 鞋鞋 袜襪 帽帽 套套 围圍 巾巾 衬襯 钱錢 伞傘 颜顏 色色 型型 穿穿 戴戴 脱脫 换換 试試 妆妝 双雙 漂漂 亮亮 美美 丑醜 看看 宽寬 窄窄 厚厚 薄薄 红紅 黄黃 蓝藍 绿綠 黑黑 白白 灰灰 紫紫 粉粉 时時 间間 周週 岁歲 现現 刚剛 才才 以以 后後 过過 去去 节節 假假 迟遲 开開 始始 结結 束束 来來 得得 及及 闲閒 学學 校校 教教 室室 图圖 书書 馆館 课課 作作 业業 考考 试試 成成 绩績 字字 词詞 句句 章章 知知 识識 专專 业業 笔筆 记記 司司 单單 位位 项項 目目 会會 议議 务務 划劃 验驗 技技 术術 能能 历歷 实實 习習 训訓 入入 创創 同同 网網 站站 软軟 件件 频頻 邮郵 件件 密密 码碼 账帳 号號 流流 量量 板板 耳耳 微微 信信 表表 情情 直直 播播 主主 粉粉 丝絲 通通 话話 赞讚 注注 问問 答答 算算 查查 练練 复複 课課 毕畢 努努 力力 责責 参參 加加 载載 打打 印印 简簡 复複 杂雜 认認 真真 聪聰 明明 清清 车車 汽汽 约約 公公 铁鐵 飞飛 自自 行行 车車 享享 电電 摩摩 托托 地地 船船 票票 站站 机機 场場 路路 桥橋 酒酒 店店 图圖 导導 航航 农農 村村 街街 园園 场場 方方 向向 灯燈 停停 场場 油油 站站 对對 东東 车車 辆輛 趟趟 班班 店店 市市 银銀 行行 价價 工工 资資 产產 顾顧 快快 递遞 购購 银銀 卡卡 红紅 余餘 额額 惠惠 订訂 发發 票票 员員 元元 块塊 斤斤 公公 买買 卖賣 付付 花花 省省 存存 借借 还還 退退 挑挑 选選 折折 扫掃 码碼 账帳 刷刷 卡卡 支支 付付 贵貴 穷窮 费費 钱錢 阳陽 光光 乡鄉 云雲 风風 雨雨 雪雪 雷雷 气氣 温溫 空空 河河 海海 湖湖 山山 石石 头頭 土土 树樹 草草 叶葉 森森 球球 猫貓 鸟鳥 兔兔 鼠鼠 虫蟲 宠寵 刮刮 流流 吹吹 晴晴 阴陰 干乾 湿濕 只隻 条條 头頭 棵棵 朵朵 座座 爱愛 谊誼 脾脾 习習 惯慣 态態 度度 闻聞 原原 结結 梦夢 系系 会會 府府 民民 声聲 机機 会會 办辦 法法 压壓 力力 觉覺 误誤 会會 说說 讲講 谈談 聊聊 告告 诉訴 回回 答答 释釋 绍紹 商商 量量 论論 决決 定定 觉覺 得得 知知 道道 懂懂 解解 相相 信信 记記 忘忘 担擔 心心 害害 怕怕 哭哭 笑笑 谢謝 歉歉 同同 意意 反反 对對 骂罵 夸誇 劝勸 祝祝 兴興 开開 难難 过過 伤傷 紧緊 张張 怪怪 别別 闹鬧
`);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitLine(lines.shift());
  return lines.map((line) => Object.fromEntries(splitLine(line).map((value, index) => [headers[index], value])));
}

function splitLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function makeGlossary(text) {
  return new Map(
    text
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function makeCharMap(text) {
  const map = new Map();
  for (const token of text.trim().split(/\s+/)) {
    const chars = Array.from(token);
    if (chars.length >= 2) map.set(chars[0], chars[1]);
  }
  return map;
}

function toTraditional(text) {
  return Array.from(text).map((char) => traditionalMap.get(char) ?? char).join("");
}

const specialExamples = new Map(Object.entries({
  我: ["我先走了，再见。", "我先走了，再見。", "Wǒ xiān zǒu le, zàijiàn.", "I am leaving first. Goodbye."],
  你: ["你想喝点什么？", "你想喝點什麼？", "Nǐ xiǎng hē diǎn shénme?", "What would you like to drink?"],
  您: ["您慢走，欢迎再来。", "您慢走，歡迎再來。", "Nín màn zǒu, huānyíng zài lái.", "Take care, and please come again."],
  他: ["他是我的中文老师。", "他是我的中文老師。", "Tā shì wǒ de Zhōngwén lǎoshī.", "He is my Chinese teacher."],
  她: ["她在葡萄牙工作。", "她在葡萄牙工作。", "Tā zài Pútáoyá gōngzuò.", "She works in Portugal."],
  它: ["小猫饿了，它一直叫。", "小貓餓了，它一直叫。", "Xiǎo māo è le, tā yìzhí jiào.", "The kitten is hungry, and it keeps meowing."],
  我们: ["我们一起去吃饭吧。", "我們一起去吃飯吧。", "Wǒmen yìqǐ qù chīfàn ba.", "Let's go eat together."],
  你们: ["你们是从哪里来的？", "你們是從哪裡來的？", "Nǐmen shì cóng nǎlǐ lái de?", "Where are you all from?"],
  他们: ["他们都会说英语。", "他們都會說英語。", "Tāmen dōu huì shuō Yīngyǔ.", "They all can speak English."],
  自己: ["这是我自己做的蛋糕。", "這是我自己做的蛋糕。", "Zhè shì wǒ zìjǐ zuò de dàngāo.", "This is a cake I made myself."],
  大家: ["大家好，请坐。", "大家好，請坐。", "Dàjiā hǎo, qǐng zuò.", "Hello everyone, please sit down."],
  别人: ["别拿别人的东西。", "別拿別人的東西。", "Bié ná biérén de dōngxi.", "Do not take other people's things."],
  这: ["这是我的行李。", "這是我的行李。", "Zhè shì wǒ de xíngli.", "This is my luggage."],
  那: ["那是谁的手机？", "那是誰的手機？", "Nà shì shéi de shǒujī?", "Whose phone is that?"],
  谁: ["门口站着的人是谁？", "門口站著的人是誰？", "Ménkǒu zhànzhe de rén shì shéi?", "Who is the person standing at the door?"],
  什么: ["你周末想做什么？", "你週末想做什麼？", "Nǐ zhōumò xiǎng zuò shénme?", "What do you want to do this weekend?"],
  哪: ["你喜欢哪件衣服？", "你喜歡哪件衣服？", "Nǐ xǐhuan nǎ jiàn yīfu?", "Which piece of clothing do you like?"],
  哪儿: ["洗手间在哪儿？", "洗手間在哪兒？", "Xǐshǒujiān zài nǎr?", "Where is the restroom?"],
  是: ["他是葡萄牙人。", "他是葡萄牙人。", "Tā shì Pútáoyá rén.", "He is Portuguese."],
  有: ["我有两个妹妹。", "我有兩個妹妹。", "Wǒ yǒu liǎng ge mèimei.", "I have two younger sisters."],
  在: ["我爸妈都在上海。", "我爸媽都在上海。", "Wǒ bà mā dōu zài Shànghǎi.", "My parents are both in Shanghai."],
  叫: ["我叫王明。", "我叫王明。", "Wǒ jiào Wáng Míng.", "My name is Wang Ming."],
  姓: ["我姓李，你呢？", "我姓李，你呢？", "Wǒ xìng Lǐ, nǐ ne?", "My surname is Li. What about you?"],
  上: ["书在桌子上。", "Shū zài zhuōzi shàng.", "The book is on the table."],
  下: ["猫在椅子下。", "Māo zài yǐzi xià.", "The cat is under the chair."],
  前: ["车站在学校前面。", "Chēzhàn zài xuéxiào qiánmiàn.", "The station is in front of the school."],
  后: ["银行在超市后面。", "Yínháng zài chāoshì hòumiàn.", "The bank is behind the supermarket."],
  左: ["请往左走。", "Qǐng wǎng zuǒ zǒu.", "Please go left."],
  右: ["路口往右拐。", "Lùkǒu wǎng yòu guǎi.", "Turn right at the intersection."],
  里: ["钥匙在包里。", "Yàoshi zài bāo lǐ.", "The key is in the bag."],
  外: ["他在门外等我。", "Tā zài mén wài děng wǒ.", "He is waiting outside the door."],
  中: ["她坐在中间。", "Tā zuò zài zhōngjiān.", "She sits in the middle."],
  点: ["我想点一碗面。", "Wǒ xiǎng diǎn yì wǎn miàn.", "I want to order a bowl of noodles."],
  长: ["这条路很长。", "Zhè tiáo lù hěn cháng.", "This road is long."],
  命: ["生命很重要。", "Shēngmìng hěn zhòngyào.", "Life is important."],
  气: ["他有点生气。", "Tā yǒudiǎn shēngqì.", "He is a little angry."],
  汗: ["我运动后出了很多汗。", "Wǒ yùndòng hòu chū le hěn duō hàn.", "I sweated a lot after exercising."],
  记: ["请记下这个号码。", "Qǐng jì xià zhège hàomǎ.", "Please write down this number."]
}));

const familyWords = new Set("爸爸 妈妈 爷爷 奶奶 外公 外婆 哥哥 姐姐 弟弟 妹妹 儿子 女儿 丈夫 妻子 老公 老婆 家人 亲戚 叔叔 阿姨 宝宝 朋友 男朋友 女朋友 同学 同事 老师 领导 老板 邻居".split(" "));
const bodyWords = new Set("头 脸 眼睛 鼻子 嘴 耳朵 牙 舌头 脖子 肩膀 手 手指 胳膊 腿 脚 肚子 背 腰 皮肤 头发 骨头 身体".split(" "));
const drinkWords = new Set("水 茶 咖啡 牛奶 果汁 酒 啤酒 饮料 汤 粥".split(" "));
const foodWords = new Set("饭 米饭 面 面条 菜 肉 鱼 鸡 鸡蛋 猪肉 牛肉 羊肉 虾 青菜 蔬菜 水果 苹果 香蕉 橘子 西瓜 葡萄 包子 饺子 馒头 面包 蛋糕 糖 盐 油 酱油 醋 早餐 午餐 晚餐 零食 外卖".split(" "));
const roomWords = new Set("家 房子 房间 屋子 楼 客厅 卧室 厕所 卫生间 厨房 餐厅 饭店 食堂 学校 教室 办公室 图书馆 公司 工作室 商店 超市 市场 银行 酒店 公园 广场 停车场 加油站 车站 机场 城市 农村 村 街".split(" "));
const clothingWords = new Set("衣服 裤子 裙子 鞋 袜子 帽子 手套 围巾 外套 毛衣 衬衫 包 书包 钱包 伞".split(" "));
const vehicleWords = new Set("车 汽车 出租车 网约车 公交车 火车 高铁 飞机 自行车 共享单车 电动车 摩托车 地铁 船".split(" "));
const animalWords = new Set("狗 猫 鸟 猪 牛 羊 马 兔子 老鼠 虫 蛇 宠物".split(" "));
const weatherWords = new Set("阳光 天空 太阳 月亮 星星 云 风 雨 雪 雷 天气 气温 温度 空气 火 光 河 海 湖 山 石头 土 树 草 花 叶子 森林 地 环境 地球 世界".split(" "));
const colorWords = new Set("红色 黄色 蓝色 绿色 黑色 白色 灰色 紫色 粉色".split(" "));
const timeWords = new Set("年 月 日 天 星期 周 小时 分钟 秒 岁 早上 上午 中午 下午 晚上 夜 白天 今天 明天 昨天 后天 前天 现在 刚才 以前 以后 最近 时候 时间 日子 季节 春 夏 秋 冬 周末 假期 生日 节日 平时 当时 未来 过去".split(" "));
const classifierExamples = new Map(Object.entries({
  个: ["我有三个问题。", "我有三個問題。", "Wǒ yǒu sān ge wèntí.", "I have three questions."],
  一些: ["冰箱里还有一些水果。", "冰箱裡還有一些水果。", "Bīngxiāng lǐ hái yǒu yìxiē shuǐguǒ.", "There is still some fruit in the refrigerator."],
  位: ["这位是我们的新同事。", "這位是我們的新同事。", "Zhè wèi shì wǒmen de xīn tóngshì.", "This person is our new colleague."],
  名: ["我们班有二十名学生。", "我們班有二十名學生。", "Wǒmen bān yǒu èrshí míng xuésheng.", "Our class has twenty students."],
  次: ["我去过一次北京。", "我去過一次北京。", "Wǒ qùguo yí cì Běijīng.", "I have been to Beijing once."],
  回: ["这是我第一回坐飞机。", "這是我第一回坐飛機。", "Zhè shì wǒ dì yī huí zuò fēijī.", "This is my first time taking a plane."],
  遍: ["请再说一遍。", "請再說一遍。", "Qǐng zài shuō yí biàn.", "Please say it again."],
  杯: ["请来两杯咖啡。", "請來兩杯咖啡。", "Qǐng lái liǎng bēi kāfēi.", "Two cups of coffee, please."],
  碗: ["我能再来一碗吗？", "我能再來一碗嗎？", "Wǒ néng zài lái yì wǎn ma?", "Can I have another bowl?"],
  盘: ["桌上有一盘水果。", "桌上有一盤水果。", "Zhuō shàng yǒu yì pán shuǐguǒ.", "There is a plate of fruit on the table."],
  瓶: ["买一瓶矿泉水。", "買一瓶礦泉水。", "Mǎi yì píng kuàngquánshuǐ.", "Buy a bottle of mineral water."],
  份: ["我们要了两份炒饭。", "我們要了兩份炒飯。", "Wǒmen yào le liǎng fèn chǎofàn.", "We ordered two portions of fried rice."],
  片: ["面包上放两片火腿。", "麵包上放兩片火腿。", "Miànbāo shàng fàng liǎng piàn huǒtuǐ.", "Put two slices of ham on the bread."],
  口: ["我就尝了一口。", "我就嘗了一口。", "Wǒ jiù cháng le yì kǒu.", "I only tasted one bite."],
  顿: ["我们好好吃一顿吧。", "我們好好吃一頓吧。", "Wǒmen hǎohǎo chī yí dùn ba.", "Let's have a proper meal."],
  张: ["请给我一张纸。", "請給我一張紙。", "Qǐng gěi wǒ yì zhāng zhǐ.", "Please give me a sheet of paper."],
  把: ["家里有三把伞。", "家裡有三把傘。", "Jiā lǐ yǒu sān bǎ sǎn.", "There are three umbrellas at home."],
  件: ["她买了一件新外套。", "她買了一件新外套。", "Tā mǎi le yí jiàn xīn wàitào.", "She bought a new coat."],
  台: ["客厅里有一台电视。", "客廳裡有一台電視。", "Kètīng lǐ yǒu yì tái diànshì.", "There is a television in the living room."],
  部: ["他换了一部新手机。", "他換了一部新手機。", "Tā huàn le yí bù xīn shǒujī.", "He switched to a new mobile phone."],
  间: ["这套房子有三间卧室。", "這套房子有三間臥室。", "Zhè tào fángzi yǒu sān jiān wòshì.", "This apartment has three bedrooms."],
  套: ["他买了一套西装。", "他買了一套西裝。", "Tā mǎi le yí tào xīzhuāng.", "He bought a suit."],
  双: ["这双袜子破了个洞。", "這雙襪子破了個洞。", "Zhè shuāng wàzi pò le ge dòng.", "This pair of socks has a hole."],
  本: ["我买了三本词典。", "我買了三本詞典。", "Wǒ mǎi le sān běn cídiǎn.", "I bought three dictionaries."],
  节: ["今天上了四节课。", "今天上了四節課。", "Jīntiān shàng le sì jié kè.", "We had four classes today."],
  门: ["这学期我选了五门课。", "這學期我選了五門課。", "Zhè xuéqī wǒ xuǎn le wǔ mén kè.", "I chose five courses this semester."],
  辆: ["门口停着一辆红色的车。", "門口停著一輛紅色的車。", "Ménkǒu tíngzhe yí liàng hóngsè de chē.", "A red car is parked at the entrance."],
  趟: ["我去了一趟银行。", "我去了一趟銀行。", "Wǒ qù le yí tàng yínháng.", "I made a trip to the bank."],
  班: ["我赶上了最后一班地铁。", "我趕上了最後一班地鐵。", "Wǒ gǎnshàng le zuìhòu yì bān dìtiě.", "I caught the last subway train."],
  元: ["这本书三十元。", "這本書三十元。", "Zhè běn shū sānshí yuán.", "This book is thirty yuan."],
  块: ["苹果五块钱一斤。", "蘋果五塊錢一斤。", "Píngguǒ wǔ kuài qián yì jīn.", "Apples are five yuan per jin."],
  毛: ["找您五毛钱。", "找您五毛錢。", "Zhǎo nín wǔ máo qián.", "Here is fifty cents in change."],
  斤: ["我买了两斤香蕉。", "我買了兩斤香蕉。", "Wǒ mǎi le liǎng jīn xiāngjiāo.", "I bought two jin of bananas."],
  公斤: ["行李不能超过二十公斤。", "行李不能超過二十公斤。", "Xíngli bù néng chāoguò èrshí gōngjīn.", "The luggage cannot exceed twenty kilograms."],
  米: ["他身高一米八。", "他身高一米八。", "Tā shēngāo yì mǐ bā.", "He is 1.8 meters tall."],
  只: ["树上有两只鸟。", "樹上有兩隻鳥。", "Shù shàng yǒu liǎng zhī niǎo.", "There are two birds in the tree."],
  条: ["他钓到了一条大鱼。", "他釣到了一條大魚。", "Tā diào dào le yì tiáo dà yú.", "He caught a big fish."],
  头: ["农场里养了十头猪。", "農場裡養了十頭豬。", "Nóngchǎng lǐ yǎng le shí tóu zhū.", "The farm raises ten pigs."],
  棵: ["门前种了一棵桃树。", "門前種了一棵桃樹。", "Mén qián zhòng le yì kē táoshù.", "A peach tree was planted in front of the door."],
  朵: ["她头上戴了一朵花。", "她頭上戴了一朵花。", "Tā tóu shàng dài le yì duǒ huā.", "She is wearing a flower in her hair."],
  座: ["城里新修了一座大桥。", "城裡新修了一座大橋。", "Chéng lǐ xīn xiū le yí zuò dàqiáo.", "A large bridge was newly built in the city."]
}));

const classifierMeanings = new Map(Object.entries({
  一些: "some",
  次: "time; occurrence",
  回: "time; occurrence",
  遍: "time; occurrence",
  位: "person; honorific classifier",
  名: "person; classifier for people",
  元: "yuan",
  块: "colloquial yuan",
  毛: "jiao; dime",
  斤: "jin, 500 grams",
  公斤: "kilogram",
  米: "meter"
}));

const numberExamples = new Map(Object.entries({
  一: ["我要一杯咖啡。", "我要一杯咖啡。", "Wǒ yào yì bēi kāfēi.", "I want a cup of coffee."],
  二: ["请到二楼等我。", "請到二樓等我。", "Qǐng dào èr lóu děng wǒ.", "Please wait for me on the second floor."],
  三: ["我们三点见面。", "我們三點見面。", "Wǒmen sān diǎn jiànmiàn.", "We will meet at three o'clock."],
  四: ["他家有四口人。", "他家有四口人。", "Tā jiā yǒu sì kǒu rén.", "There are four people in his family."],
  五: ["现在是下午五点。", "現在是下午五點。", "Xiànzài shì xiàwǔ wǔ diǎn.", "It is five o'clock in the afternoon now."],
  六: ["我六月去里斯本。", "我六月去里斯本。", "Wǒ liù yuè qù Lǐsīběn.", "I am going to Lisbon in June."],
  七: ["一个星期有七天。", "一個星期有七天。", "Yí ge xīngqī yǒu qī tiān.", "A week has seven days."],
  八: ["我晚上八点到家。", "我晚上八點到家。", "Wǒ wǎnshang bā diǎn dào jiā.", "I get home at eight in the evening."],
  九: ["他儿子今年九岁。", "他兒子今年九歲。", "Tā érzi jīnnián jiǔ suì.", "His son is nine years old this year."],
  十: ["他这次考了第十名。", "他這次考了第十名。", "Tā zhè cì kǎo le dì shí míng.", "He ranked tenth on this exam."],
  百: ["这里能坐一百个人。", "這裡能坐一百個人。", "Zhèlǐ néng zuò yì bǎi ge rén.", "This place can seat one hundred people."],
  千: ["这台电脑八千块。", "這台電腦八千塊。", "Zhè tái diànnǎo bā qiān kuài.", "This computer costs eight thousand yuan."],
  万: ["这辆车要十万。", "這輛車要十萬。", "Zhè liàng chē yào shí wàn.", "This car costs one hundred thousand."],
  亿: ["中国有十四亿人。", "中國有十四億人。", "Zhōngguó yǒu shísì yì rén.", "China has 1.4 billion people."],
  零: ["我的房间号是三零五。", "我的房間號是三零五。", "Wǒ de fángjiān hào shì sān líng wǔ.", "My room number is 305."],
  两: ["我买了两张票。", "我買了兩張票。", "Wǒ mǎi le liǎng zhāng piào.", "I bought two tickets."],
  半: ["我们十点半出发。", "我們十點半出發。", "Wǒmen shí diǎn bàn chūfā.", "We set off at half past ten."]
}));

function fixedExample(value) {
  if (value.length === 4) {
    const [zh, traditional, pinyin, english] = value;
    return { zh, traditional, pinyin, en: () => english };
  }

  const [zh, pinyin, english] = value;
  return { zh, pinyin, en: () => english };
}

function buildExample(word, wordPinyin, partOfSpeech, theme) {
  if (specialExamples.has(word)) {
    return fixedExample(specialExamples.get(word));
  }

  if (partOfSpeech === "量词") {
    if (classifierExamples.has(word)) {
      return fixedExample(classifierExamples.get(word));
    }

    return {
      zh: `我学会了用${word}。`,
      pinyin: `Wǒ xuéhuì le yòng ${wordPinyin}.`,
      en: () => `I learned how to use "${word}" naturally.`
    };
  }

  if (partOfSpeech === "代词") {
    return {
      zh: `我今天练习“${word}”这个代词。`,
      pinyin: `Wǒ jīntiān liànxí "${wordPinyin}" zhège dàicí.`,
      en: () => `I am practicing the pronoun "${word}" today.`
    };
  }

  if (partOfSpeech === "数词") {
    if (numberExamples.has(word)) {
      return fixedExample(numberExamples.get(word));
    }

    return {
      zh: `我写了${word}遍。`,
      pinyin: `Wǒ xiě le ${wordPinyin} biàn.`,
      en: (english) => `I wrote it ${english} time.`
    };
  }

  if (partOfSpeech === "动词") {
    const verbExamples = new Map(Object.entries({
      住: ["我住在波尔图。", "我住在波爾圖。", "Wǒ zhù zài Bōěrtú.", "I live in Porto."],
      来自: ["她来自法国。", "她來自法國。", "Tā láizì Fǎguó.", "She comes from France."],
      出生: ["我1990年出生在广州。", "我1990年出生在廣州。", "Wǒ yī jiǔ jiǔ líng nián chūshēng zài Guǎngzhōu.", "I was born in Guangzhou in 1990."],
      长大: ["我在海边的小城长大。", "我在海邊的小城長大。", "Wǒ zài hǎibiān de xiǎo chéng zhǎngdà.", "I grew up in a small seaside town."],
      旅游: ["我们周末去旅游。", "Wǒmen zhōumò qù lǚyóu.", "We travel on the weekend."],
      旅行: ["她喜欢一个人旅行。", "Tā xǐhuan yí ge rén lǚxíng.", "She likes traveling alone."],
      出国: ["他明年想出国。", "Tā míngnián xiǎng chūguó.", "He wants to go abroad next year."],
      回国: ["她下个月回国。", "Tā xià ge yuè huíguó.", "She returns to her country next month."],
      搬家: ["我们周末搬家。", "Wǒmen zhōumò bānjiā.", "We are moving this weekend."],
      定居: ["他们想在这里定居。", "Tāmen xiǎng zài zhèlǐ dìngjū.", "They want to settle here."],
      爱: ["我爱我的家人。", "Wǒ ài wǒ de jiārén.", "I love my family."],
      喜欢: ["我喜欢喝茶。", "Wǒ xǐhuan hē chá.", "I like drinking tea."],
      照顾: ["她照顾宝宝。", "Tā zhàogù bǎobao.", "She takes care of the baby."],
      关心: ["朋友很关心我。", "Péngyou hěn guānxīn wǒ.", "My friend cares about me."],
      认识: ["我认识这位老师。", "Wǒ rènshi zhè wèi lǎoshī.", "I know this teacher."],
      吃: ["我想吃饺子。", "Wǒ xiǎng chī jiǎozi.", "I want to eat dumplings."],
      喝: ["她每天喝咖啡。", "Tā měitiān hē kāfēi.", "She drinks coffee every day."],
      穿: ["我今天穿外套。", "Wǒ jīntiān chuān wàitào.", "I am wearing a coat today."],
      戴: ["她冬天戴围巾。", "Tā dōngtiān dài wéijīn.", "She wears a scarf in winter."],
      去: ["我去学校。", "Wǒ qù xuéxiào.", "I go to school."],
      来: ["他明天来我家。", "Tā míngtiān lái wǒ jiā.", "He comes to my home tomorrow."],
      走: ["我们走路去公园。", "Wǒmen zǒulù qù gōngyuán.", "We walk to the park."],
      跑: ["他每天早上跑步。", "Tā měitiān zǎoshang pǎobù.", "He runs every morning."]
    }));

    if (verbExamples.has(word)) {
      return fixedExample(verbExamples.get(word));
    }

    return {
      zh: `我正在练习怎么${word}。`,
      pinyin: `Wǒ zhèngzài liànxí zěnme ${wordPinyin}.`,
      en: (english) => `I am practicing how ${english}.`
    };
  }

  if (partOfSpeech === "形容词") {
    if (colorWords.has(word)) {
      return {
        zh: `我喜欢${word}。`,
        pinyin: `Wǒ xǐhuan ${wordPinyin}.`,
        en: (english) => `I like ${english}.`
      };
    }

    return {
      zh: `这个很${word}。`,
      pinyin: `Zhège hěn ${wordPinyin}.`,
      en: (english) => `This is ${english}.`
    };
  }

  if (familyWords.has(word)) {
    return {
      zh: `我周末去看${word}。`,
      pinyin: `Wǒ zhōumò qù kàn ${wordPinyin}.`,
      en: (english) => `I visit my ${english} on the weekend.`
    };
  }

  if (bodyWords.has(word)) {
    return {
      zh: `我的${word}有点疼。`,
      pinyin: `Wǒ de ${wordPinyin} yǒudiǎn téng.`,
      en: (english) => `My ${english} hurts a little.`
    };
  }

  if (drinkWords.has(word)) {
    return {
      zh: `我想喝一杯${word}。`,
      pinyin: `Wǒ xiǎng hē yì bēi ${wordPinyin}.`,
      en: (english) => `I want to drink a cup of ${english}.`
    };
  }

  if (foodWords.has(word)) {
    return {
      zh: `我晚饭想吃${word}。`,
      pinyin: `Wǒ wǎnfàn xiǎng chī ${wordPinyin}.`,
      en: (english) => `I want to eat ${english} for dinner.`
    };
  }

  if (clothingWords.has(word)) {
    return {
      zh: `我今天带了${word}。`,
      pinyin: `Wǒ jīntiān dài le ${wordPinyin}.`,
      en: (english) => `I brought ${english} today.`
    };
  }

  if (vehicleWords.has(word)) {
    return {
      zh: `我坐${word}去上班。`,
      pinyin: `Wǒ zuò ${wordPinyin} qù shàngbān.`,
      en: (english) => `I take ${english} to work.`
    };
  }

  if (animalWords.has(word)) {
    return {
      zh: `我在公园看见一只${word}。`,
      pinyin: `Wǒ zài gōngyuán kànjiàn yì zhī ${wordPinyin}.`,
      en: (english) => `I saw a ${english} in the park.`
    };
  }

  if (weatherWords.has(word)) {
    return {
      zh: `今天的${word}很美。`,
      pinyin: `Jīntiān de ${wordPinyin} hěn měi.`,
      en: (english) => `Today's ${english} is beautiful.`
    };
  }

  if (timeWords.has(word)) {
    return {
      zh: `我${word}有空。`,
      pinyin: `Wǒ ${wordPinyin} yǒu kòng.`,
      en: (english) => `I am free ${english}.`
    };
  }

  if (roomWords.has(word)) {
    return {
      zh: `我在${word}等你。`,
      pinyin: `Wǒ zài ${wordPinyin} děng nǐ.`,
      en: (english) => `I am waiting for you at the ${english}.`
    };
  }

  if (theme.includes("居家") || theme.includes("物品")) {
    return {
      zh: `我把${word}放好了。`,
      pinyin: `Wǒ bǎ ${wordPinyin} fàng hǎo le.`,
      en: (english) => `I put away the ${english}.`
    };
  }

  if (theme.includes("学习") || theme.includes("工作") || theme.includes("数字")) {
    return {
      zh: `我今天要练习${word}。`,
      pinyin: `Wǒ jīntiān yào liànxí ${wordPinyin}.`,
      en: (english) => `I need to practice ${english} today.`
    };
  }

  if (theme.includes("购物") || theme.includes("消费")) {
    return {
      zh: `我在商店办好了${word}。`,
      pinyin: `Wǒ zài shāngdiàn bàn hǎo le ${wordPinyin}.`,
      en: (english) => `I handled the ${english} at the shop.`
    };
  }

  if (theme.includes("情感") || theme.includes("沟通") || theme.includes("社会")) {
    return {
      zh: `我们聊到了${word}。`,
      pinyin: `Wǒmen liáo dào le ${wordPinyin}.`,
      en: (english) => `We talked about ${english}.`
    };
  }

  return {
    zh: `我今天用到了${word}。`,
    pinyin: `Wǒ jīntiān yòng dào le ${wordPinyin}.`,
    en: (english) => `I used ${english} today.`
  };
}

const rows = parseCsv(fs.readFileSync(source, "utf8").replace(/^\uFEFF/, ""));
const entries = rows.map((row, index) => {
  const rawSimplified = row["词"]?.trim() ?? "";
  const partOfSpeech = row["词类"]?.trim() ?? "";
  const simplified = rawSimplified === "些" && partOfSpeech === "量词" ? "一些" : rawSimplified;
  const pinyin = rawSimplified === "些" && partOfSpeech === "量词" ? "yìxiē" : row.pinyin;
  const english =
    partOfSpeech === "量词"
      ? classifierMeanings.get(simplified) ?? "classifier"
      : glossary.get(simplified) ?? `${partOfSpeech || "word"}: ${row.theme}`;
  const traditional = toTraditional(simplified);
  const example = buildExample(simplified, pinyin, partOfSpeech, row.theme);
  return {
    id: `u${row.unit}-${slug(simplified)}-${index + 1}`,
    unit: row.unit,
    theme: row.theme,
    partOfSpeech,
    simplified,
    traditional,
    pinyin,
    english,
    exampleSimplified: example.zh,
    exampleTraditional: example.traditional ?? toTraditional(example.zh),
    examplePinyin: example.pinyin,
    exampleEnglish: example.en(english)
  };
});

fs.writeFileSync(
  outFile,
  `import type { VocabEntry } from "../types";\n\nexport const vocabulary: VocabEntry[] = ${JSON.stringify(entries, null, 2)};\n`,
  "utf8"
);

console.log(`Wrote ${entries.length} entries to ${outFile}`);

function slug(value) {
  return encodeURIComponent(value).replace(/%/g, "").toLowerCase();
}
