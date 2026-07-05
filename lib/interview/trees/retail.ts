import type { InterviewTree } from "../types";

/** 小売業向け質問ツリー（7セクション・31問） */
export const retailTree: InterviewTree = {
  industry: "retail",
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
          hint: "例：静岡県浜松市、商店街の角地",
          required: true,
        },
        {
          key: "basic.founded",
          text: "お店を始めたのはいつ頃ですか？",
          hint: "例：昭和50年に父が創業、私は2代目",
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
          hint: "例：私1人＋繁忙期だけ妻が手伝う",
          required: true,
        },
      ],
    },
    {
      id: "products",
      title: "扱っている商品について",
      intro: "お店で扱っている商品について教えてください。",
      questions: [
        {
          key: "products.main",
          text: "主にどんな商品を扱っていますか？",
          hint: "例：作業服と安全靴、贈答用の果物、化粧品と日用品",
          required: true,
        },
        {
          key: "products.price_range",
          text: "お客さん1人あたり、1回の買い物でだいたいいくらくらい使われますか？",
          hint: "例：2,000〜3,000円、贈答品シーズンは1万円超も",
          required: true,
        },
        {
          key: "products.bestseller",
          text: "一番よく売れる商品と、その理由を教えてください。",
          required: true,
        },
        {
          key: "products.seasonality",
          text: "季節や時期によって、売上に波はありますか？",
          hint: "例：お中元・お歳暮の時期が売上の山、冬物が動く11〜2月が勝負",
        },
        {
          key: "products.specialty",
          text: "「うちでしか買えない」「うちだから選ばれる」というものはありますか？",
          hint: "例：サイズ直しを無料でやる、地元でうちしか扱っていないメーカー品",
        },
        {
          key: "products.online",
          text: "ネット販売（通販）はしていますか？している場合、売上のどれくらいですか？",
          hint: "例：していない、楽天に出していて売上の2割ほど",
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
          hint: "例：近所の年配の方、仕事帰りの職人さん",
        },
        {
          key: "customers.regulars",
          text: "常連さん（顔なじみのお客さん）は、全体のどれくらいを占めていますか？",
        },
        {
          key: "customers.corporate",
          text: "会社や学校など、法人からのまとまった注文はありますか？",
          hint: "例：地元の建設会社3社に作業服を納めている",
        },
        {
          key: "customers.channels",
          text: "新しいお客さんは、何がきっかけで来られることが多いですか？",
          hint: "例：常連さんの紹介、チラシ、通りがかり",
        },
      ],
    },
    {
      id: "suppliers",
      title: "仕入れ・取引先について",
      intro: "商品の仕入れ先について教えてください。",
      questions: [
        {
          key: "suppliers.main",
          text: "主な仕入れ先を教えてください。何をどこから仕入れていますか？",
          hint: "例：メーカー直仕入れが7割、あとは問屋2社",
        },
        {
          key: "suppliers.terms",
          text: "仕入れの支払いはどのようにしていますか？",
          hint: "例：月末締め翌月末払い、現金問屋で都度払い",
        },
        {
          key: "suppliers.substitutes",
          text: "今の仕入れ先が使えなくなった場合、代わりは見つかりそうですか？",
          hint: "例：問屋は他にもある、あのメーカーの代理店権はうちだけ",
        },
        {
          key: "suppliers.personal",
          text: "「自分だから付き合ってもらえている」という取引先はありますか？",
          hint: "例：先代からの付き合いで掛け率を特別にしてもらっている",
        },
        {
          key: "suppliers.inventory",
          text: "在庫はどれくらい持っていますか？管理はどのようにしていますか？",
          hint: "例：店と倉庫で仕入れ値ベース300万円分ほど、管理は目視と手書きの台帳",
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
          hint: "例：9時〜19時、水曜定休",
        },
        {
          key: "operations.daily",
          text: "開店から閉店まで、1日の流れをざっと教えてください。",
          hint: "例：朝は品出しと発注、午後は配達に出ることが多い",
        },
        {
          key: "operations.keyperson",
          text: "お店を回すうえで、欠かせない人は誰ですか？その人は何をしていますか？",
          hint: "例：仕入れと値付けは全部自分がやっている",
        },
        {
          key: "operations.knowhow",
          text: "商品選びや値付けのコツは、紙やデータに残していますか？それとも頭の中だけですか？",
        },
        {
          key: "operations.delivery",
          text: "配達や外商（お得意さん回り）はしていますか？",
          hint: "例：週2回、軽トラで市内の得意先を回る",
        },
        {
          key: "operations.tools",
          text: "レジや会計、帳簿づけはどのようにしていますか？",
          hint: "例：レジは10年もの、帳簿は妻が手書き、確定申告は税理士さん",
        },
      ],
    },
    {
      id: "assets",
      title: "設備・お店の物件・許認可",
      intro: "お店の物件や設備、営業に必要な許可について教えてください。",
      questions: [
        {
          key: "assets.property",
          text: "お店の物件は、ご自身の持ち物ですか？借りていますか？",
          hint: "例：土地建物とも自己所有、店舗部分だけ月8万円で借りている",
        },
        {
          key: "assets.equipment",
          text: "陳列棚や冷蔵ケース、車など、主な設備を教えてください。",
          hint: "例：冷蔵ショーケース2台、配達用の軽トラ1台",
        },
        {
          key: "assets.licenses",
          text: "営業に必要な許可や資格はありますか？",
          hint: "例：酒類販売免許、たばこ小売販売許可、古物商許可。特になければ「なし」で結構です",
        },
        {
          key: "assets.leases",
          text: "リースやローンで使っているものはありますか？",
          hint: "例：POSレジがリース、車のローンが残っている",
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
          hint: "例：目利きと値付け、得意先の担当者との関係",
          required: true,
        },
        {
          key: "risks.key_staff",
          text: "この人が辞めたらお店が困る、という人はいますか？",
          hint: "例：外商を任せている息子、長年のパートさん",
          required: true,
        },
        {
          key: "risks.unwritten",
          text: "紙には書いていない「うちのやり方・暗黙のルール」はありますか？",
          hint: "例：山田さんの家には月末に集金に行く、常連には端数をまける",
          required: true,
        },
        {
          key: "risks.handover_time",
          text: "引き継ぎには、どれくらいの期間が必要だと思いますか？その間、手伝えますか？",
          hint: "例：得意先を一緒に回るのに3か月はほしい",
          required: true,
        },
        {
          key: "risks.concerns",
          text: "お店を譲るにあたって、心配なことや譲れない条件はありますか？",
          hint: "例：得意先に迷惑をかけたくない、在庫は全部引き取ってほしい",
        },
      ],
    },
  ],
};
