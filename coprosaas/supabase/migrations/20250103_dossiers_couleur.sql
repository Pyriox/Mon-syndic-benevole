-- Ajoute une colonne de couleur personnalisable sur les dossiers de documents
ALTER TABLE document_dossiers ADD COLUMN IF NOT EXISTS couleur TEXT DEFAULT NULL;
