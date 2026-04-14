import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import fr from './fr.json';
import en from './en.json';
import zh from './zh.json';

export type Lang = 'fr' | 'en' | 'zh';

const nested: Record<Lang, any> = { fr, en, zh };

// Flat admin translations kept for backward compatibility (admin pages use flat keys)
const flat: Record<Lang, Record<string, string>> = {
  fr: {
    'nav.catalogue': 'Catalogue', 'nav.devis': 'Devis', 'nav.factures': 'Factures',
    'nav.conteneurs': 'Conteneurs', 'nav.sav': 'SAV', 'nav.partenaires': 'Partenaires',
    'nav.produits': 'Produits', 'nav.clients': 'Clients', 'nav.taux': 'Taux RMB',
    'nav.logs': 'Logs', 'nav.parametres': 'Paramètres', 'nav.dashboard': 'Tableau de bord',
    'nav.commissions': 'Commissions', 'nav.frais': 'Frais Logistique', 'nav.stock': 'Stock',
    'nav.analytics': 'Analytics',
    'sort.recent': 'Plus récents', 'sort.oldest': 'Plus anciens',
    'btn.dupliquer': 'Dupliquer', 'btn.nouveau': 'Nouveau', 'btn.enregistrer': 'Enregistrer',
    'btn.annuler': 'Annuler', 'btn.encaisser': 'Encaisser', 'btn.generer': 'Générer',
    'btn.connexion': 'Connexion', 'btn.deconnexion': 'Déconnexion', 'btn.inscription': 'Inscription',
    'btn.voir.catalogue': 'Voir le catalogue', 'btn.ajouter.panier': 'Ajouter au panier',
    'btn.demander.devis': 'Demander un devis',
    'champ.manquant': 'Champ manquant', 'prix.non.disponible': 'Connectez-vous pour voir les prix',
    'statut.brouillon': 'Brouillon', 'statut.envoye': 'Envoyé', 'statut.accepte': 'Accepté',
    'statut.refuse': 'Refusé', 'statut.annule': 'Annulé',
    'admin.login.title': 'Administration 97import', 'admin.login.email': 'Email',
    'admin.login.password': 'Mot de passe', 'admin.login.submit': 'Se connecter',
    'saved': 'Sauvegardé', 'error': 'Erreur', 'loading': 'Chargement...',
  },
  en: {
    'nav.catalogue': 'Catalogue', 'nav.devis': 'Quotes', 'nav.factures': 'Invoices',
    'nav.conteneurs': 'Containers', 'nav.sav': 'After-Sales', 'nav.partenaires': 'Partners',
    'nav.produits': 'Products', 'nav.clients': 'Clients', 'nav.taux': 'RMB Rate',
    'nav.logs': 'Logs', 'nav.parametres': 'Settings', 'nav.dashboard': 'Dashboard',
    'nav.commissions': 'Commissions', 'nav.frais': 'Logistics Costs', 'nav.stock': 'Stock',
    'nav.analytics': 'Analytics',
    'sort.recent': 'Most Recent', 'sort.oldest': 'Oldest First',
    'btn.dupliquer': 'Duplicate', 'btn.nouveau': 'New', 'btn.enregistrer': 'Save',
    'btn.annuler': 'Cancel', 'btn.encaisser': 'Collect Payment', 'btn.generer': 'Generate',
    'btn.connexion': 'Login', 'btn.deconnexion': 'Logout', 'btn.inscription': 'Register',
    'btn.voir.catalogue': 'View Catalogue', 'btn.ajouter.panier': 'Add to Cart',
    'btn.demander.devis': 'Request Quote',
    'champ.manquant': 'Missing field', 'prix.non.disponible': 'Log in to see prices',
    'statut.brouillon': 'Draft', 'statut.envoye': 'Sent', 'statut.accepte': 'Accepted',
    'statut.refuse': 'Refused', 'statut.annule': 'Cancelled',
    'admin.login.title': '97import Administration', 'admin.login.email': 'Email',
    'admin.login.password': 'Password', 'admin.login.submit': 'Login',
    'saved': 'Saved', 'error': 'Error', 'loading': 'Loading...',
  },
  zh: {
    'nav.catalogue': '产品目录', 'nav.devis': '报价单', 'nav.factures': '发票',
    'nav.conteneurs': '集装箱', 'nav.sav': '售后服务', 'nav.partenaires': '合作伙伴',
    'nav.produits': '产品', 'nav.clients': '客户', 'nav.taux': '汇率',
    'nav.logs': '日志', 'nav.parametres': '设置', 'nav.dashboard': '控制面板',
    'nav.commissions': '佣金', 'nav.frais': '物流费用', 'nav.stock': '库存',
    'nav.analytics': '分析',
    'sort.recent': '最新', 'sort.oldest': '最旧',
    'btn.dupliquer': '复制', 'btn.nouveau': '新建', 'btn.enregistrer': '保存',
    'btn.annuler': '取消', 'btn.encaisser': '收款', 'btn.generer': '生成',
    'btn.connexion': '登录', 'btn.deconnexion': '退出', 'btn.inscription': '注册',
    'btn.voir.catalogue': '查看目录', 'btn.ajouter.panier': '加入购物车',
    'btn.demander.devis': '申请报价',
    'champ.manquant': '缺少字段', 'prix.non.disponible': '请登录查看价格',
    'statut.brouillon': '草稿', 'statut.envoye': '已发送', 'statut.accepte': '已接受',
    'statut.refuse': '已拒绝', 'statut.annule': '已取消',
    'admin.login.title': '97import 管理', 'admin.login.email': '邮箱',
    'admin.login.password': '密码', 'admin.login.submit': '登录',
    'saved': '已保存', 'error': '错误', 'loading': '加载中...',
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  const t = useCallback((key: string): string => {
    // Try nested JSON path first (e.g. "nav.accueil" → nested.fr.nav.accueil)
    const keys = key.split('.');
    let value: any = nested[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') return value;
    // Fallback to flat admin translations
    return flat[lang][key] ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export const useLang = () => useContext(I18nContext).lang;
