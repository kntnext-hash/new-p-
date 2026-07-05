import type { InterviewTree } from "../types";

/** 小規模製造業向け質問ツリー（7セクション・32問） */
export const manufacturingTree: InterviewTree = {
  industry: "manufacturing",
  sections: [
    {
      id: "basic",
      title: "事業の基本情報",
      intro: "まずは、工場・工房の基本的なことを教えてください。",
      questions: [
        {
          key: "basic.name",
          text: "屋号または会社名を教えてください。",
          input: "text",
          required: true,
        },
        {
          key: "basic.location",
          text: "工場（作業場）はどちらにありますか？",
          hint: "例：大阪府東大阪市の工業団地内、自宅隣の作業場",
          required: true,
        },
        {
          key: "basic.founded",
          text: "事業を始めたのはいつ頃ですか？",
          hint: "例：昭和45年に父が創業、私は2代目",
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
          text: "働いている人は、ご自身も含めて何人いますか？職人さん・家族・パートも教えてください。",
          hint: "例：私と職人2人、事務は妻",
          required: true,
        },
      ],
    },
    {
      id: "products",
      title: "作っているものについて",
      intro: "どんなものを作っているのか教えてください。",
      questions: [
        {
          key: "products.main",
          text: "主にどんなものを作っていますか？",
          hint: "例：自動車部品の金属プレス加工、和菓子の製造、木製家具",
          required: true,
        },
        {
          key: "products.price_range",
          text: "1回の注文（受注）は、だいたいいくらくらいの規模ですか？",
          hint: "例：1ロット5万〜30万円、月にまとめて100万円ほど",
          required: true,
        },
        {
          key: "products.bestseller",
          text: "売上の柱になっている製品・加工は何ですか？その理由も教えてください。",
          required: true,
        },
        {
          key: "products.seasonality",
          text: "時期によって、仕事量に波はありますか？",
          hint: "例：年度末に集中する、お盆と正月前が繁忙期",
        },
        {
          key: "products.specialty",
          text: "「うちにしかできない」技術や強みはありますか？",
          hint: "例：0.01ミリ単位の精度、この地域でうちしかやらない特殊メッキ",
        },
        {
          key: "products.capacity",
          text: "今の体制で、月にどれくらいの量を作れますか？余力はありますか？",
          hint: "例：月1万個が上限でほぼいっぱい、まだ3割は余力がある",
        },
      ],
    },
    {
      id: "customers",
      title: "取引先（売り先）について",
      intro: "作ったものを納めている相手について教えてください。",
      questions: [
        {
          key: "customers.profile",
          text: "主な納め先（お客さん）はどこですか？",
          hint: "例：地元の機械メーカー2社、問屋経由で全国の小売店",
          required: false,
        },
        {
          key: "customers.concentration",
          text: "売上が一番大きい取引先は、全体のどれくらいを占めていますか？",
          hint: "例：A社だけで売上の6割",
        },
        {
          key: "customers.contract",
          text: "取引は契約書がありますか？それとも長年の付き合いでの口約束ですか？",
        },
        {
          key: "customers.channels",
          text: "新しい仕事は、どうやって入ってくることが多いですか？",
          hint: "例：既存取引先からの紹介、組合のつながり、ホームページ",
        },
      ],
    },
    {
      id: "suppliers",
      title: "仕入れ・外注について",
      intro: "材料の仕入れ先や、外注に出している仕事について教えてください。",
      questions: [
        {
          key: "suppliers.main",
          text: "主な材料の仕入れ先を教えてください。",
          hint: "例：鋼材は○○商事、副資材は地元の金物屋",
        },
        {
          key: "suppliers.terms",
          text: "仕入れの支払いはどのようにしていますか？",
          hint: "例：月末締め翌月払い",
        },
        {
          key: "suppliers.outsourcing",
          text: "外注に出している工程はありますか？どこに何を頼んでいますか？",
          hint: "例：メッキは△△工業、熱処理は市外の専門業者",
        },
        {
          key: "suppliers.substitutes",
          text: "今の仕入れ先や外注先が使えなくなった場合、代わりは見つかりそうですか？",
        },
        {
          key: "suppliers.personal",
          text: "「自分だから付き合ってもらえている」という取引先はありますか？",
          hint: "例：無理な短納期も先代からの付き合いで受けてもらっている",
        },
      ],
    },
    {
      id: "operations",
      title: "仕事の回し方",
      intro: "毎日の仕事がどのように回っているか教えてください。",
      questions: [
        {
          key: "operations.hours",
          text: "操業時間（仕事をしている時間）と休みを教えてください。",
          hint: "例：8時〜17時、土日休み。納期前は残業もある",
        },
        {
          key: "operations.daily",
          text: "注文を受けてから納品するまでの流れを、ざっと教えてください。",
          hint: "例：FAXで注文→材料手配→加工→検品→自社便で納品",
        },
        {
          key: "operations.keyperson",
          text: "仕事を回すうえで、欠かせない人は誰ですか？その人は何をしていますか？",
          hint: "例：段取りと検品は自分、機械のことは職人の鈴木さん",
        },
        {
          key: "operations.skills",
          text: "図面や加工条件、作り方のコツは、紙やデータに残していますか？それとも頭の中だけですか？",
        },
        {
          key: "operations.quality",
          text: "品質の確認（検品）は、どのようにしていますか？",
          hint: "例：全数を目視、抜き取りで測定器にかける",
        },
        {
          key: "operations.tools",
          text: "受注管理や帳簿づけはどのようにしていますか？",
          hint: "例：受注はFAXと電話でノートに記録、経理は妻がやっている",
        },
      ],
    },
    {
      id: "assets",
      title: "設備・工場の物件・許認可",
      intro: "工場の物件や機械、必要な許可について教えてください。",
      questions: [
        {
          key: "assets.property",
          text: "工場（作業場）の土地・建物は、ご自身の持ち物ですか？借りていますか？",
          hint: "例：土地建物とも自己所有、月15万円で借りている",
        },
        {
          key: "assets.equipment",
          text: "主な機械・設備を教えてください。古さや調子も分かれば。",
          hint: "例：プレス機3台（うち1台は40年もの）、フォークリフト",
        },
        {
          key: "assets.licenses",
          text: "事業に必要な許可や資格はありますか？",
          hint: "例：食品製造業許可、危険物取扱者、ISOの認証。特になければ「なし」で結構です",
        },
        {
          key: "assets.leases",
          text: "リースやローンで使っているものはありますか？",
          hint: "例：新しいNC旋盤がリース中（残り3年）",
        },
      ],
    },
    {
      id: "risks",
      title: "引き継ぎで大事なこと",
      intro:
        "最後に、事業を引き継ぐ人が知っておくべきことを教えてください。ここが一番大切なところです。",
      questions: [
        {
          key: "risks.owner_only",
          text: "「自分しか知らない・自分にしかできない」ことは何ですか？",
          hint: "例：機械の微調整、値決め、取引先の担当者との関係",
          required: true,
        },
        {
          key: "risks.key_staff",
          text: "この人が辞めたら仕事が回らなくなる、という人はいますか？",
          hint: "例：溶接は職人の鈴木さんしかできない",
          required: true,
        },
        {
          key: "risks.unwritten",
          text: "紙には書いていない「うちのやり方・暗黙のルール」はありますか？",
          hint: "例：A社の納品は必ず午前中、機械は金曜に必ず油をさす",
          required: true,
        },
        {
          key: "risks.handover_time",
          text: "引き継ぎには、どれくらいの期間が必要だと思いますか？その間、手伝えますか？",
          hint: "例：技術を教えるのに1年、取引先へのあいさつ回りは付き添える",
          required: true,
        },
        {
          key: "risks.concerns",
          text: "事業を譲るにあたって、心配なことや譲れない条件はありますか？",
          hint: "例：職人さんの雇用は守ってほしい、取引先との関係を大事にしてほしい",
        },
      ],
    },
  ],
};
