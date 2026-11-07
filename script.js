(() => {
const propertyGrid = document.getElementById('propertyGrid');
const propertyForm = document.getElementById('propertyForm');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const emptyState = document.getElementById('emptyState');
const counter = document.getElementById('counter');
const backendStatus = document.getElementById('backendStatus');
const accountPanel = document.getElementById('accountPanel');
const authForm = document.getElementById('authForm');
const authStatus = document.getElementById('authStatus');
const signedInPanel = document.getElementById('signedInPanel');
const signedInAs = document.getElementById('signedInAs');
const signOutButton = document.getElementById('signOutButton');
const publishAccess = document.getElementById('publishAccess');
const propertyStatus = document.getElementById('propertyStatus');
const bookingModal = document.getElementById('bookingModal');
const modalPropertyTitle = document.getElementById('modalPropertyTitle');
const modalPrice = document.getElementById('modalPrice');
const paymentForm = document.getElementById('paymentForm');

const defaultProperties = [
    {
        id: 1,
        title: 'Belle villa meublée',
        type: 'Villa',
        location: 'Ouaga 2000, Ouagadougou',
        price: 250000,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        contact: '+226 70 00 00 01'
    },
    {
        id: 2,
        title: 'Appartement propre 2 pièces',
        type: 'Appartement',
        location: 'Koulouba, Ouagadougou',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        contact: '+226 76 00 00 02'
    }
];

const config = window.FASO_YIIR_SUPABASE;
const supabaseConfigPresent = Boolean(config?.url && config?.anonKey);
const supabaseReady = Boolean(
    supabaseConfigPresent &&
    window.supabase?.createClient
);
const supabase = supabaseReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

let properties = [];
let currentUser = null;
let selectedProperty = null;

function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('status-error', isError);
    element.classList.toggle('status-normal', !isError);
}

function isAdmin() {
    return currentUser?.app_metadata?.role === 'admin';
}

function canDeleteProperty(property) {
    return isAdmin() || (currentUser && property.created_by === currentUser.id);
}

function renderProperties(data = properties) {
    propertyGrid.replaceChildren();
    counter.textContent = `${data.length} bien(s) trouvé(s)`;
    emptyState.classList.toggle('hidden', data.length !== 0);

    data.forEach(property => {
        const card = document.createElement('article');
        card.className = 'property-card';

        const details = document.createElement('div');
        const imageFrame = document.createElement('div');
        imageFrame.className = 'property-photo';
        const image = document.createElement('img');
        image.alt = property.title;
        try {
            const imageUrl = new URL(property.image);
            if (imageUrl.protocol === 'https:' || imageUrl.protocol === 'http:') {
                image.src = imageUrl.href;
            }
        } catch {
            image.alt = `${property.title} (photo indisponible)`;
        }
        const type = document.createElement('span');
        type.className = 'property-type';
        type.textContent = property.type;
        imageFrame.append(image, type);

        const text = document.createElement('div');
        text.className = 'property-info';
        const title = document.createElement('h3');
        title.className = 'property-title';
        title.textContent = property.title;
        const location = document.createElement('p');
        location.className = 'property-location';
        location.textContent = property.location;
        const price = document.createElement('p');
        price.className = 'property-price';
        price.textContent = `${Number(property.price).toLocaleString()} FCFA / mois`;
        text.append(title, location, price);
        details.append(imageFrame, text);

        const actions = document.createElement('div');
        actions.className = 'property-actions';
        const reserveButton = document.createElement('button');
        reserveButton.type = 'button';
        reserveButton.className = 'button button-primary button-full';
        reserveButton.textContent = 'Réserver & Payer';
        reserveButton.addEventListener('click', () => window.openModal(property.id));

        const secondaryActions = document.createElement('div');
        secondaryActions.className = 'property-links';
        const callLink = document.createElement('a');
        callLink.className = 'button call-link';
        callLink.href = `tel:${String(property.contact).replace(/[^\d+]/g, '')}`;
        callLink.textContent = 'Appeler';
        secondaryActions.append(callLink);

        if (canDeleteProperty(property)) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'button delete-button';
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => window.deleteProperty(property.id));
            secondaryActions.append(deleteButton);
        }

        actions.append(reserveButton, secondaryActions);
        card.append(details, actions);
        propertyGrid.append(card);
    });
}

function updateAccountUI() {
    const signedIn = Boolean(currentUser);
    authForm.classList.toggle('hidden', signedIn || !supabaseReady);
    signedInPanel.classList.toggle('hidden', !signedIn);
    propertyForm.classList.toggle('hidden', !signedIn || !supabaseReady);
    publishAccess.classList.toggle('hidden', signedIn && supabaseReady);
    if (signedIn) {
        signedInAs.textContent = `Connecté : ${currentUser.email}`;
    } else if (supabaseReady) {
        publishAccess.textContent = 'Connectez-vous ou créez un compte pour publier une annonce.';
    }
    renderProperties();
}

async function loadProperties() {
    if (!supabaseReady) {
        properties = defaultProperties;
        backendStatus.textContent = supabaseConfigPresent
            ? 'La bibliothèque Supabase ne s’est pas chargée. Vérifiez votre connexion Internet ; la publication est désactivée.'
            : 'La base partagée n’est pas encore configurée. Le catalogue de démonstration est affiché ; la publication est désactivée.';
        updateAccountUI();
        return;
    }

    backendStatus.textContent = '';
    const { data, error } = await supabase
        .from('properties')
        .select('id, title, type, location, price, image, contact, created_by')
        .order('created_at', { ascending: false });

    if (error) {
        properties = defaultProperties;
        renderProperties();
        setStatus(backendStatus, `La base partagée n’est pas encore prête (${error.message}). Le catalogue de démonstration reste affiché.`, true);
        return;
    }

    properties = data;
    renderProperties();
}

function filterAndRender() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const selectedType = filterType.value;
    const filtered = properties.filter(property => {
        const matchesText = property.title.toLocaleLowerCase().includes(query) ||
            property.location.toLocaleLowerCase().includes(query);
        return matchesText && (!selectedType || property.type === selectedType);
    });
    renderProperties(filtered);
}

window.openModal = function(id) {
    selectedProperty = properties.find(property => property.id === id);
    if (!selectedProperty) {
        return;
    }
    modalPropertyTitle.textContent = `${selectedProperty.title} (${selectedProperty.location})`;
    modalPrice.value = `${Number(selectedProperty.price).toLocaleString()} FCFA`;
    bookingModal.classList.remove('hidden');
};

window.closeModal = function() {
    bookingModal.classList.add('hidden');
    paymentForm.reset();
};

paymentForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (!selectedProperty) {
        return;
    }
    const operator = document.querySelector('input[name="operator"]:checked')?.value;
    const phone = document.getElementById('payerPhone').value;
    alert(`Demande de paiement envoyée !\n\nUn code de validation ${operator} a été envoyé au ${phone} pour la réservation de : "${selectedProperty.title}".\n\n(Simulation réussie)`);
    window.closeModal();
});

authForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!supabaseReady) {
        setStatus(authStatus, 'La connexion à la base n’est pas configurée.', true);
        return;
    }

    const submitter = event.submitter;
    const mode = submitter?.value;
    const email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    const { error, data } = mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        setStatus(authStatus, error.message, true);
        return;
    }

    if (mode === 'signup' && !data.session) {
        setStatus(authStatus, 'Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse avant de vous connecter.');
        authForm.reset();
        return;
    }

    setStatus(authStatus, mode === 'signup' ? 'Compte créé et connecté.' : 'Connexion réussie.');
    currentUser = data.user;
    updateAccountUI();
    await loadProperties();
});

signOutButton.addEventListener('click', async function() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        setStatus(authStatus, `La déconnexion a échoué : ${error.message}`, true);
        return;
    }
    currentUser = null;
    updateAccountUI();
    setStatus(authStatus, 'Vous êtes déconnecté.');
});

propertyForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!supabaseReady || !currentUser) {
        setStatus(propertyStatus, 'Connectez-vous pour publier une annonce.', true);
        return;
    }

    const submitButton = propertyForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus(propertyStatus, 'Publication en cours…');

    let imageUrl = document.getElementById('image').value.trim();
    const file = document.getElementById('imageFile').files[0];
    if (!file && !imageUrl) {
        setStatus(propertyStatus, 'Ajoutez une photo ou renseignez le lien de la photo.', true);
        submitButton.disabled = false;
        return;
    }

    if (file) {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            setStatus(propertyStatus, 'Choisissez une image de 5 Mo maximum.', true);
            submitButton.disabled = false;
            return;
        }
        const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
        const objectPath = `${currentUser.id}/${crypto.randomUUID()}.${extension || 'img'}`;
        const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(objectPath, file, { contentType: file.type, upsert: false });
        if (uploadError) {
            setStatus(propertyStatus, `Échec de l’envoi de la photo : ${uploadError.message}`, true);
            submitButton.disabled = false;
            return;
        }
        imageUrl = supabase.storage.from('property-images').getPublicUrl(objectPath).data.publicUrl;
    }

    try {
        const parsedImageUrl = new URL(imageUrl);
        if (parsedImageUrl.protocol !== 'https:' && parsedImageUrl.protocol !== 'http:') {
            throw new Error('URL non autorisée');
        }
    } catch {
        setStatus(propertyStatus, 'Le lien de la photo doit être une adresse HTTP ou HTTPS valide.', true);
        submitButton.disabled = false;
        return;
    }

    const newProperty = {
        title: document.getElementById('title').value.trim(),
        type: document.getElementById('type').value,
        location: document.getElementById('location').value.trim(),
        price: Number(document.getElementById('price').value),
        image: imageUrl,
        contact: document.getElementById('contact').value.trim()
    };
    const { error } = await supabase.from('properties').insert(newProperty);

    if (error) {
        setStatus(propertyStatus, `L’annonce n’a pas pu être publiée : ${error.message}`, true);
        submitButton.disabled = false;
        return;
    }

    propertyForm.reset();
    setStatus(propertyStatus, 'Annonce publiée et visible par tous les visiteurs.');
    submitButton.disabled = false;
    await loadProperties();
});

window.deleteProperty = async function(id) {
    const property = properties.find(item => item.id === id);
    if (!property || !canDeleteProperty(property) || !confirm('Voulez-vous supprimer cette annonce ?')) {
        return;
    }

    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
        setStatus(propertyStatus, `La suppression a échoué : ${error.message}`, true);
        return;
    }
    await loadProperties();
};

searchInput.addEventListener('input', filterAndRender);
filterType.addEventListener('change', filterAndRender);

async function initializeApp() {
    if (!supabaseReady) {
        currentUser = null;
        updateAccountUI();
        await loadProperties();
        return;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        updateAccountUI();
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        setStatus(authStatus, `Impossible de vérifier la session : ${error.message}`, true);
    } else {
        currentUser = data.session?.user ?? null;
    }
    updateAccountUI();
    await loadProperties();
}

initializeApp();
})();
