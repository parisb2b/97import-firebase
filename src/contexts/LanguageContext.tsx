import React, { createContext, useContext, useState } from 'react'

export type Lang = 'fr' | 'zh'

// ── Dictionnaire FR / 中文 ────────────────────────────────
const TRANSLATIONS = {
  fr: {
    // Navigation
    nav_home:       'Accueil',
    nav_products:   'Produits',
    nav_about:      'À propos',
    nav_contact:    'Contact',
    nav_login:      'Se connecter',
    nav_account:    'Mon compte',
    nav_logout:     'Déconnexion',
    nav_cart:       'Panier',

    // Catégories
    cat_mini_pelles:  'Mini-pelles',
    cat_maisons:      'Maisons modulaires',
    cat_solaire:      'Kits solaires',
    cat_accessories:  'Accessoires',
    cat_camping_car:  'Camping-car',
    cat_agriculture:  'Machines Agricoles',
    cat_standard:     'Standard',
    cat_premium:      'Premium',

    // Boutons / actions
    btn_quote:      'Demander un devis',
    btn_add_cart:   'Ajouter au panier',
    btn_buy:        'Acheter',
    btn_login:      'Se connecter',
    btn_register:   'Créer un compte',
    btn_send:       'Envoyer',
    btn_save:       'Sauvegarder',
    btn_cancel:     'Annuler',
    btn_confirm:    'Confirmer',
    btn_back:       'Retour',

    // Auth
    auth_email:     'Email',
    auth_password:  'Mot de passe',
    auth_google:    'Connexion avec Google',
    auth_microsoft: 'Connexion avec Microsoft',
    auth_facebook:  'Connexion avec Facebook',
    auth_no_account:'Pas encore de compte ?',
    auth_create:    'Créer un compte',
    auth_error:     'Email ou mot de passe incorrect.',

    // Espace client
    my_quotes:      'Mes devis',
    my_profile:     'Mon profil',
    my_commissions: 'Mes commissions',
    my_security:    'Sécurité',

    // Devis
    quote_number:   'N° devis',
    quote_date:     'Date',
    quote_status:   'Statut',
    quote_total:    'Total HT',
    quote_deposit:  'Acompte',
    quote_balance:  'Solde restant',

    // Produit
    prod_ref:       'Réf.',
    prod_price:     'Prix HT',
    prod_qty:       'Quantité',
    prod_total:     'Total HT',

    // Messages
    msg_loading:    'Chargement...',
    msg_empty:      'Aucun résultat',
    msg_error:      'Une erreur est survenue.',
    msg_success:    'Opération réussie.',

    // Contact / Devis
    contact_nom:        'Nom',
    contact_email:      'Email',
    contact_tel:        'Téléphone',
    contact_message:    'Message',
    contact_sujet:      'Sujet',
    contact_envoyer:    'Envoyer',
    contact_sent:       'Message envoyé avec succès !',
    contact_error:      'Erreur lors de l\'envoi.',

    // Livraison
    livraison_title:    'Livraison DOM-TOM',
    livraison_desc:     'Transport maritime depuis la Chine vers les Antilles françaises',
    dest_martinique:    'Martinique',
    dest_guadeloupe:    'Guadeloupe',
    dest_guyane:        'Guyane',
    dest_reunion:       'La Réunion',
    dest_mayotte:       'Mayotte',

    // Compte
    account_orders:     'Mes commandes',
    account_commissions: 'Mes commissions',

    // Devis
    devis_send:         'Envoyer la demande',
    devis_destination:  'Destination',
    devis_success:      'Demande de devis envoyée !',

    // PDF / Documents
    pdf_download:       'Télécharger le PDF',
    pdf_generating:     'Génération en cours...',

    // Site
    site_banner:    '-50% PAR RAPPORT AU PRIX DE VENTE EN MARTINIQUE',
    site_contact:   'Nous contacter',
    site_about:     'À propos de 97import.com',
    site_slogan:    'L\'importation n\'a jamais été aussi simple',
  },
  zh: {
    // Navigation
    nav_home:       '首页',
    nav_products:   '产品',
    nav_about:      '关于我们',
    nav_contact:    '联系我们',
    nav_login:      '登录',
    nav_account:    '我的账户',
    nav_logout:     '退出登录',
    nav_cart:       '购物车',

    // Catégories
    cat_mini_pelles:  '小型挖掘机',
    cat_maisons:      '模块化房屋',
    cat_solaire:      '太阳能套件',
    cat_accessories:  '配件',
    cat_camping_car:  '房车',
    cat_agriculture:  '农业机械',
    cat_standard:     '标准版',
    cat_premium:      '高级版',

    // Boutons / actions
    btn_quote:      '申请报价',
    btn_add_cart:   '加入购物车',
    btn_buy:        '购买',
    btn_login:      '登录',
    btn_register:   '创建账户',
    btn_send:       '发送',
    btn_save:       '保存',
    btn_cancel:     '取消',
    btn_confirm:    '确认',
    btn_back:       '返回',

    // Auth
    auth_email:     '电子邮件',
    auth_password:  '密码',
    auth_google:    '使用 Google 登录',
    auth_microsoft: '使用 Microsoft 登录',
    auth_facebook:  '使用 Facebook 登录',
    auth_no_account:'还没有账户？',
    auth_create:    '创建账户',
    auth_error:     '邮箱或密码不正确。',

    // Espace client
    my_quotes:      '我的报价',
    my_profile:     '个人资料',
    my_commissions: '我的佣金',
    my_security:    '安全',

    // Devis
    quote_number:   '报价编号',
    quote_date:     '日期',
    quote_status:   '状态',
    quote_total:    '不含税总额',
    quote_deposit:  '定金',
    quote_balance:  '余款',

    // Produit
    prod_ref:       '参考编号',
    prod_price:     '不含税价格',
    prod_qty:       '数量',
    prod_total:     '不含税总额',

    // Messages
    msg_loading:    '加载中...',
    msg_empty:      '无结果',
    msg_error:      '发生错误。',
    msg_success:    '操作成功。',

    // Contact / Devis
    contact_nom:        '姓名',
    contact_email:      '电子邮件',
    contact_tel:        '电话',
    contact_message:    '消息',
    contact_sujet:      '主题',
    contact_envoyer:    '发送',
    contact_sent:       '消息发送成功！',
    contact_error:      '发送时出错。',

    // Livraison
    livraison_title:    'DOM-TOM配送',
    livraison_desc:     '从中国到法属安的列斯群岛的海运',
    dest_martinique:    '马提尼克',
    dest_guadeloupe:    '瓜德罗普',
    dest_guyane:        '法属圭亚那',
    dest_reunion:       '留尼汪',
    dest_mayotte:       '马约特',

    // Compte
    account_orders:     '我的订单',
    account_commissions: '我的佣金',

    // Devis
    devis_send:         '发送报价请求',
    devis_destination:  '目的地',
    devis_success:      '报价请求已发送！',

    // PDF / Documents
    pdf_download:       '下载PDF',
    pdf_generating:     '生成中...',

    // Site
    site_banner:    '比马提尼克岛零售价低50%',
    site_contact:   '联系我们',
    site_about:     '关于97import.com',
    site_slogan:    '进口从未如此简单',
  },
} as const

type TranslationKey = keyof typeof TRANSLATIONS['fr']

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')

  function t(key: TranslationKey): string {
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS['fr'][key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}

// Composant toggle FR / 中文
export function LangToggle({ style }: { style?: React.CSSProperties }) {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'zh' : 'fr')}
      title={lang === 'fr' ? 'Switch to Chinese' : '切换到法语'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        background: 'transparent',
        border: '0.5px solid #D1D5DB',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        color: '#374151',
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
    >
      🌐 {lang === 'fr' ? '中文' : 'FR'}
    </button>
  )
}
