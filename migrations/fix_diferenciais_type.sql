-- Garantir que a coluna diferenciais é text[]
DO $$
BEGIN
    -- Verificar se a coluna existe e alterar se necessário
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ecommerce_products'
        AND column_name = 'diferenciais'
        AND data_type != 'ARRAY'
    ) THEN
        ALTER TABLE ecommerce_products
        ALTER COLUMN diferenciais TYPE text[]
        USING CASE
            WHEN diferenciais IS NULL THEN NULL
            WHEN diferenciais = '' THEN ARRAY[]::text[]
            ELSE string_to_array(diferenciais::text, ',')
        END;
        
        RAISE NOTICE 'Coluna diferenciais convertida para text[]';
    ELSE
        RAISE NOTICE 'Coluna diferenciais já é do tipo correto';
    END IF;
END $$;
