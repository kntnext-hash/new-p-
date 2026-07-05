import type { InterviewTree } from "../types";

/** 飲食業向け質問ツリー（7セクション・31問） */
export const restaurantTree: InterviewTree = {
  industry: "restaurant",
  sections: [
    {
      id: "basic",
      title: "お店の基本情報",
      intro: "まずは、お店の基本的なことを教えてください。",
      questions: [
        {
          key: "basic.name",
          text: "お店の名前（屋号）を教えてください。",
          input: "text",
          required: true,
        },
        {
          key: "basic.location",
          text: "お店はどちらにありますか？",
          hint: "例：愛知県名古屋市中区、駅から徒歩5分の商店街の中",
          required: true,
        },
        {
          key: "basic.founded",
          text: "お店を始めたのはいつ頃ですか?",
          hint: "例：昭和60年頃、2005年 など、だいたいで結構です",
          input: "text",
          required: true,
        },
        {
          key: "basic.entity",
          text: "個人でやられていますか？それとも会社（法人）にしていますか？",
          hint: "例：個人事業、有限会社、株式会社",
          input: "text",
          required: true,
        },
        {
          key: "basic.staff",
          text: "働いている人は、ご自身も含めて何人いますか？家族・パート・アルバイトも教えてください。",
          hint: "例：私と妻の2人＋パート2人（昼のみ）",
          required: true,
        },
      ],
    },
    {
      id: "products",
      title: "メニュー・商品について",
      intro: "お店の看板となる料理やメニューについて教えてください。",
      questions: [
        {
          key: "products.main",
          text: "お店の主力メニュー・看板メニューは何ですか？",
          hint: "例：味噌煮込みうどん、日替わり定食",
          required: true,
        },
        {
          key: "products.price_range",
          text: "お客さん1人あたり、だいたいいくらくらい使われますか？",
          hint: "例：昼は800円前後、夜は3,000円くらい",
          required: true,
        },
        {
          key: "products.bestseller",
          text: "一番よく出る（売れる）メニューと、その理由を教えてください。",
          required: true,
        },
        {
          key: "products.seasonality",
          text: "季節や曜日によって、売上に波はありますか？",
          hint: "例：夏は冷やし中華でお客さんが増える、年末は宴会で忙しい",
        },
        {
          key: "products.specialty",
          text: "「これはうちにしかない」というこだわりや自慢はありますか？",
          hint: "例：創業からつぎ足しのタレ、自家製の麺",
        },
      ],
    },
    {
      id: "customers",
      title: "お客さんについて",
      intro: "どんなお客さんが来られるのか教えてください。",
      questions: [
        {
          key: "customers.profile",
          text: "どんなお客さんが多いですか？年齢層や職業など、思いつくままで結構です。",
          hint: "例：近所の常連さん、昼は近くの会社勤めの人",
        },
        {
          key: "customers.regulars",
          text: "常連さんは、お客さん全体のどれくらいを占めていますか？",
          hint: "例：半分以上は顔なじみ、ほとんど一見さん",
        },
        {
          key: "customers.corporate",
          text: "会社の宴会や仕出しなど、法人（会社）からの注文はありますか？",
          hint: "例：近くの工場から毎日弁当の注文がある",
        },
        {
          key: "customers.channels",
          text: "新しいお客さんは、何がきっかけで来られることが多いですか？",
          hint: "例：口コミ、食べログ、通りがかり",
        },
        {
          key: "customers.reservation",
          text: "予約のお客さんと、ふらっと来るお客さん、どちらが多いですか？",
        },
      ],
    },
    {
      id: "suppliers",
      title: "仕入れ・取引先について",
      intro: "材料の仕入れ先など、取引のあるお相手について教えてください。",
      questions: [
        {
          key: "suppliers.main",
          text: "主な仕入れ先を教えてください。何をどこから仕入れていますか？",
          hint: "例：野菜は市場の八百屋、肉は○○精肉店、酒は地元の酒屋",
        },
        {
          key: "suppliers.terms",
          text: "仕入れの支払いはどのようにしていますか？",
          hint: "例：月末締めの翌月払い、その場で現金",
        },
        {
          key: "suppliers.substitutes",
          text: "今の仕入れ先が使えなくなった場合、代わりは見つかりそうですか？",
          hint: "例：スーパーでも代用できる、あの豆腐屋以外では味が変わってしまう",
        },
        {
          key: "suppliers.personal",
          text: "「自分だから付き合ってもらえている」という取引先はありますか？",
          hint: "例：先代からの付き合いで特別に安くしてもらっている",
        },
      ],
    },
    {
      id: "operations",
      title: "お店の回し方",
      intro: "毎日の営業がどのように回っているか教えてください。",
      questions: [
        {
          key: "operations.hours",
          text: "営業時間と定休日を教えてください。",
          hint: "例：11時〜14時、17時〜21時。日曜定休",
        },
        {
          key: "operations.daily",
          text: "開店から閉店まで、1日の流れをざっと教えてください。",
          hint: "例：朝8時に仕込み開始、11時開店…",
        },
        {
          key: "operations.keyperson",
          text: "お店を回すうえで、欠かせない人は誰ですか？その人は何をしていますか？",
          hint: "例：調理は全部自分、ホールは妻に任せきり",
        },
        {
          key: "operations.recipes",
          text: "レシピや作り方は、紙やデータに残していますか？それとも頭の中だけですか？",
        },
        {
          key: "operations.shifts",
          text: "従業員やパートさんの勤務は、どのように決めていますか？",
          hint: "例：シフト表を毎月作る、決まった曜日に来てもらう",
        },
        {
          key: "operations.tools",
          text: "レジや会計、帳簿づけはどのようにしていますか？",
          hint: "例：昔ながらのレジで帳簿は手書き、会計ソフトを使っている",
        },
      ],
    },
    {
      id: "assets",
      title: "設備・お店の物件・許認可",
      intro: "お店の設備や物件、営業に必要な許可について教えてください。",
      questions: [
        {
          key: "assets.property",
          text: "お店の物件は、ご自身の持ち物ですか？借りていますか？",
          hint: "例：自宅兼店舗で自己所有、家賃10万円で借りている",
        },
        {
          key: "assets.equipment",
          text: "厨房設備など、主な設備を教えてください。古さや調子も分かれば。",
          hint: "例：業務用冷蔵庫2台（10年もの）、製麺機",
        },
        {
          key: "assets.licenses",
          text: "営業に必要な許可や資格は何をお持ちですか？",
          hint: "例：飲食店営業許可、酒類提供、食品衛生責任者",
        },
        {
          key: "assets.leases",
          text: "リースやローンで使っているものはありますか？",
          hint: "例：食器洗浄機がリース、車のローンが残っている",
        },
      ],
    },
    {
      id: "risks",
      title: "引き継ぎで大事なこと",
      intro:
        "最後に、お店を引き継ぐ人が知っておくべきことを教えてください。ここが一番大切なところです。",
      questions: [
        {
          key: "risks.owner_only",
          text: "「自分しか知らない・自分にしかできない」ことは何ですか？",
          hint: "例：タレの仕込み、常連さんの好みの把握、市場での目利き",
          required: true,
        },
        {
          key: "risks.key_staff",
          text: "この人が辞めたらお店が困る、という人はいますか？",
          hint: "例：20年勤めてくれているパートの田中さん",
          required: true,
        },
        {
          key: "risks.unwritten",
          text: "紙には書いていない「うちのやり方・暗黙のルール」はありますか？",
          hint: "例：常連の佐藤さんには小盛りで出す、雨の日は仕込みを減らす",
          required: true,
        },
        {
          key: "risks.handover_time",
          text: "引き継ぎには、どれくらいの期間が必要だと思いますか？その間、手伝えますか？",
          hint: "例：半年は一緒に厨房に立たないと無理だと思う",
          required: true,
        },
        {
          key: "risks.concerns",
          text: "お店を譲るにあたって、心配なことや譲れない条件はありますか？",
          hint: "例：従業員は続けて雇ってほしい、屋号は残してほしい",
        },
      ],
    },
  ],
};
