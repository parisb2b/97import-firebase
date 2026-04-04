// extract_supabase.js - Script d'extraction des données Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const supabaseUrl = 'https://gdqdbgonndmnauyetvht.supabase.co';
const supabaseKey = 'sb_publishable_GuTlUBZt3WaTLdnLGSwVcw_-iT6FQ-g';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dossier de sortie
const outputDir = 'C:\\DATA-MC-2030\\97IMPORT\\SAVE2026\\01_Supabase_Database';

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function getTables() {
    try {
        // Récupérer la liste des tables via une requête SQL
        const { data, error } = await supabase
            .rpc('get_tables'); // Essayons d'abord une fonction RPC si elle existe
        
        if (error) {
            console.log('⚠️  Fonction RPC non disponible, tentative via SQL...');
            // Alternative: exécuter une requête SQL brute
            const { data: sqlData, error: sqlError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
            
            if (sqlError) throw sqlError;
            return sqlData.map(t => t.table_name);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des tables:', error.message);
        return [];
    }
}

async function extractTable(tableName) {
    try {
        console.log(`📥 Extraction de la table: ${tableName}...`);
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
        
        if (error) {
            console.error(`⚠️  Erreur sur ${tableName}: ${error.message}`);
            return { table: tableName, count: 0, error: error.message };
        }
        
        // Sauvegarder en JSON
        const jsonPath = path.join(outputDir, `${tableName}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
        
        // Sauvegarder en CSV
        if (data && data.length > 0) {
            const csvPath = path.join(outputDir, `${tableName}.csv`);
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
                    return String(val).replace(/,/g, ';').replace(/\n/g, ' ');
                }).join(','))
            ].join('\n');
            fs.writeFileSync(csvPath, csvContent);
        }
        
        console.log(`✅ ${tableName}: ${data ? data.length : 0} enregistrements`);
        return { table: tableName, count: data ? data.length : 0 };
        
    } catch (error) {
        console.error(`❌ Erreur sur ${tableName}:`, error.message);
        return { table: tableName, count: 0, error: error.message };
    }
}

async function extractStorageBuckets() {
    try {
        console.log('📦 Extraction des buckets de stockage...');
        
        const { data: buckets, error } = await supabase
            .storage
            .listBuckets();
        
        if (error) throw error;
        
        const bucketsInfo = [];
        
        for (const bucket of buckets) {
            console.log(`  📁 Bucket: ${bucket.name}`);
            
            // Lister les fichiers dans le bucket
            const { data: files, error: filesError } = await supabase
                .storage
                .from(bucket.name)
                .list();
            
            if (filesError) {
                console.error(`  ⚠️  Erreur liste ${bucket.name}: ${filesError.message}`);
            }
            
            bucketsInfo.push({
                name: bucket.name,
                id: bucket.id,
                public: bucket.public,
                fileCount: files ? files.length : 0,
                files: files || []
            });
        }
        
        // Sauvegarder les infos des buckets
        const bucketsPath = path.join(outputDir, 'storage_buckets.json');
        fs.writeFileSync(bucketsPath, JSON.stringify(bucketsInfo, null, 2));
        
        console.log(`✅ ${buckets.length} buckets extraits`);
        return bucketsInfo;
        
    } catch (error) {
        console.error('❌ Erreur extraction buckets:', error.message);
        return [];
    }
}

async function generateReadme(results) {
    const readmeContent = `# Export Base de données Supabase - 97import.com

**Date d'extraction**: ${new Date().toLocaleString('fr-FR')}
**Projet**: ${supabaseUrl}

## 📊 Résumé

| Table | Enregistrements | Fichiers générés |
|-------|-----------------|------------------|
${results.map(r => `| ${r.table} | ${r.count} | JSON, CSV |`).join('\n')}

**Total**: ${results.reduce((sum, r) => sum + r.count, 0)} enregistrements dans ${results.length} tables

## 📁 Fichiers

- Fichiers JSON: Format structuré pour réimportation
- Fichiers CSV: Format tableur (Excel, LibreOffice)
- 

## 🔗 Liens utiles

- [Supabase Dashboard](${supabaseUrl})
- [Documentation Supabase](https://supabase.com/docs)

## ⚠️ Notes

- Les données sont exportées avec les permissions de la clé API utilisée
- Les fichiers sensibles peuvent être filtrés par les politiques RLS
- Les URLs des fichiers stockés sont valides selon les permissions du bucket
`;

    fs.writeFileSync(path.join(outputDir, 'README_DATABASE.md'), readmeContent);
}

async function main() {
    console.log('='.repeat(60));
    console.log('Extraction Supabase - 97import.com');
    console.log('='.repeat(60));
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Dossier de sortie: ${outputDir}`);
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    const results = [];
    
    // Test de connexion
    console.log('\n🔌 Test de connexion...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
        console.error('❌ Erreur de connexion:', authError.message);
        process.exit(1);
    }
    console.log('✅ Connexion réussie');
    
    // Essayer d'extraire les tables
    console.log('\n📋 Extraction des tables...');
    
    // Liste des tables à essayer (tables courantes d'un site e-commerce)
    const commonTables = [
        'users', 'profiles', 'products', 'categories', 'orders', 
        'order_items', 'cart', 'cart_items', 'payments', 'shipping',
        'images', 'documents', 'settings', 'contacts', 'newsletter'
    ];
    
    for (const table of commonTables) {
        const result = await extractTable(table);
        results.push(result);
    }
    
    // Extraction des buckets de stockage
    console.log('\n📦 Extraction du stockage...');
    await extractStorageBuckets();
    
    // Générer le README
    console.log('\n📝 Génération du rapport...');
    await generateReadme(results);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('Extraction terminée !');
    console.log('='.repeat(60));
    console.log(`⏱️  Durée: ${duration}s`);
    console.log(`📁 Dossier: ${outputDir}`);
    console.log(`📊 Tables: ${results.filter(r => r.count > 0).length}/${results.length} avec données`);
    console.log(`📈 Total: ${results.reduce((sum, r) => sum + r.count, 0)} enregistrements`);
    console.log('='.repeat(60));
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
