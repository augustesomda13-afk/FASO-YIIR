delete from public.properties
where (title, type, location, price, image, contact) in (
    (
        'Belle villa meublée',
        'Villa',
        'Ouaga 2000, Ouagadougou',
        250000,
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        '+226 70 00 00 01'
    ),
    (
        'Appartement propre 2 pièces',
        'Appartement',
        'Koulouba, Ouagadougou',
        75000,
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        '+226 76 00 00 02'
    )
)
returning id, title, location, contact;
