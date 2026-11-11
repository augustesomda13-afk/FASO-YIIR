(() => {
const propertyGrid = document.getElementById('propertyGrid');
const myPropertyList = document.getElementById('myPropertyList');
const myPropertiesCounter = document.getElementById('myPropertiesCounter');
const myPropertiesEmpty = document.getElementById('myPropertiesEmpty');
const myPropertiesEmptyMessage = document.getElementById('myPropertiesEmptyMessage');
const myPropertiesLoginLink = document.getElementById('myPropertiesLoginLink');
const myPropertiesPublishLink = document.getElementById('myPropertiesPublishLink');
const myPropertiesStatus = document.getElementById('myPropertiesStatus');
const editPropertyPanel = document.getElementById('editPropertyPanel');
const editPropertyForm = document.getElementById('editPropertyForm');
const editPropertyStatus = document.getElementById('editPropertyStatus');
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
let editingPropertyId = null;

function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('status-error', isError);
    element.classList.toggle('status-normal', !isError);
}

function isAdmin() {
    return currentUser?.app_metadata?.role === 'admin';
}

function getWhatsAppNumber(contact) {
    const digits = String(contact ?? '').replace(/\D/g, '');
    const nationalNumber = digits.startsWith('00226')
        ? digits.slice(5)
        : digits.startsWith('226')
            ? digits.slice(3)
            : digits;
    const localNumber = nationalNumber.length === 9 && nationalNumber.startsWith('0')
        ? nationalNumber.slice(1)
        : nationalNumber;

    return /^\d{8}$/.test(localNumber) ? `226${localNumber}` : null;
}

function getTelephoneHref(contact) {
    const value = String(contact ?? '').trim();
    const digits = value.replace(/\D/g, '');
    const whatsAppNumber = getWhatsAppNumber(value);
    if (whatsAppNumber) {
        return `tel:+${whatsAppNumber}`;
    }

    const internationalNumber = digits.startsWith('00') ? digits.slice(2) : digits;
    if (!(value.startsWith('+') || digits.startsWith('00')) || !/^\d{7,15}$/.test(internationalNumber)) {
        return null;
    }
    return `tel:+${internationalNumber}`;
}

function renderMyProperties() {
    myPropertyList.replaceChildren();
    const ownProperties = currentUser
        ? properties.filter(property => property.created_by === currentUser.id)
        : [];

    myPropertiesCounter.textContent = `${ownProperties.length} annonce(s)`;
    myPropertiesEmpty.classList.toggle('hidden', ownProperties.length !== 0);
    myPropertiesEmptyMessage.textContent = currentUser
        ? 'Vous n’avez pas encore publié d’annonce.'
        : 'Connectez-vous pour consulter et gérer vos annonces.';
    myPropertiesLoginLink.classList.toggle('hidden', Boolean(currentUser));
    myPropertiesPublishLink.classList.toggle('hidden', !currentUser);

    ownProperties.forEach(property => {
        const item = document.createElement('article');
        item.className = 'my-property-item';

        const details = document.createElement('div');
        details.className = 'my-property-details';
        const title = document.createElement('h3');
        title.className = 'my-property-title';
        title.textContent = property.title;
        const summary = document.createElement('p');
        summary.className = 'my-property-summary';
        summary.textContent = `${property.type} · ${property.location} · ${Number(property.price).toLocaleString()} FCFA / mois`;
        details.append(title, summary);

        const actions = document.createElement('div');
        actions.className = 'my-property-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'button button-secondary';
        editButton.textContent = 'Modifier';
        editButton.addEventListener('click', () => window.editProperty(property.id));
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'button delete-button';
        deleteButton.textContent = 'Supprimer';
        deleteButton.addEventListener('click', () => window.deleteProperty(property.id));
        actions.append(editButton, deleteButton);

        item.append(details, actions);
        myPropertyList.append(item);
    });
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
        const whatsAppNumber = getWhatsAppNumber(property.contact);
        const telephoneHref = getTelephoneHref(property.contact);
        let showContactButton = true;
        const contactButton = document.createElement('a');
        contactButton.className = 'button button-primary button-full';
        if (whatsAppNumber) {
            const message = `Bonjour, je suis intéressé(e) par « ${property.title} » à ${property.location}, affiché à ${Number(property.price).toLocaleString()} FCFA par mois. Est-il toujours disponible ?`;
            contactButton.href = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
            contactButton.target = '_blank';
            contactButton.rel = 'noopener noreferrer';
            contactButton.textContent = 'Écrire sur WhatsApp';
        } else if (telephoneHref) {
            contactButton.href = telephoneHref;
            contactButton.textContent = 'Appeler l’hôte';
        } else {
            showContactButton = false;
        }

        const secondaryActions = document.createElement('div');
        secondaryActions.className = 'property-links';
        if (whatsAppNumber && telephoneHref) {
            const callLink = document.createElement('a');
            callLink.className = 'button call-link';
            callLink.href = telephoneHref;
            callLink.textContent = 'Appeler';
            secondaryActions.append(callLink);
        }

        if (currentUser && (property.created_by === currentUser.id || isAdmin())) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'button delete-button';
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => window.deleteProperty(property.id));
            secondaryActions.append(deleteButton);
        }

        if (showContactButton) {
            actions.append(contactButton);
        }
        if (secondaryActions.childElementCount || currentUser) {
            actions.append(secondaryActions);
        }
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
    renderMyProperties();
}

async function loadProperties() {
    if (!supabaseReady) {
        properties = [];
        setStatus(
            backendStatus,
            supabaseConfigPresent
                ? 'La bibliothèque de données ne s’est pas chargée. Vérifiez votre connexion ; les annonces et la publication sont indisponibles.'
                : 'La base partagée n’est pas configurée. Les annonces et la publication sont indisponibles.',
            true
        );
        updateAccountUI();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, type, location, price, image, contact, created_by')
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        properties = data ?? [];
        backendStatus.textContent = '';
    } catch (error) {
        properties = [];
        setStatus(
            backendStatus,
            `Impossible de charger les annonces (${error.message || 'erreur de connexion'}). Réessayez plus tard.`,
            true
        );
    }

    renderProperties();
    renderMyProperties();
}

window.editProperty = function(id) {
    const property = properties.find(item => item.id === id);
    if (!property || !currentUser || property.created_by !== currentUser.id) {
        return;
    }

    editingPropertyId = property.id;
    editPropertyForm.elements.title.value = property.title;
    editPropertyForm.elements.type.value = property.type;
    editPropertyForm.elements.location.value = property.location;
    editPropertyForm.elements.price.value = property.price;
    editPropertyForm.elements.image.value = property.image;
    editPropertyForm.elements.contact.value = property.contact;
    editPropertyPanel.classList.remove('hidden');
    editPropertyStatus.textContent = '';
    editPropertyPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    editPropertyForm.elements.title.focus({ preventScroll: true });
};

function cancelPropertyEdit(clearStatus = true) {
    editingPropertyId = null;
    editPropertyForm.reset();
    editPropertyPanel.classList.add('hidden');
    if (clearStatus) {
        editPropertyStatus.textContent = '';
    }
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
        contact: document.getElementById('contact').value.trim(),
        created_by: currentUser.id
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

editPropertyForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const property = properties.find(item => item.id === editingPropertyId);
    if (!supabaseReady || !currentUser || !property || property.created_by !== currentUser.id) {
        setStatus(editPropertyStatus, 'Vous ne pouvez modifier que vos propres annonces.', true);
        return;
    }

    const submitButton = editPropertyForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus(editPropertyStatus, 'Modification en cours…');
    const imageUrl = editPropertyForm.elements.image.value.trim();
    try {
        const parsedImageUrl = new URL(imageUrl);
        if (parsedImageUrl.protocol !== 'https:' && parsedImageUrl.protocol !== 'http:') {
            throw new Error('URL non autorisée');
        }
    } catch {
        setStatus(editPropertyStatus, 'Le lien de la photo doit être une adresse HTTP ou HTTPS valide.', true);
        submitButton.disabled = false;
        return;
    }

    const updates = {
        title: editPropertyForm.elements.title.value.trim(),
        type: editPropertyForm.elements.type.value,
        location: editPropertyForm.elements.location.value.trim(),
        price: Number(editPropertyForm.elements.price.value),
        image: imageUrl,
        contact: editPropertyForm.elements.contact.value.trim()
    };
    const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', editingPropertyId)
        .eq('created_by', currentUser.id)
        .select('id')
        .maybeSingle();

    if (error || !data) {
        setStatus(
            editPropertyStatus,
            error
                ? `La modification a échoué : ${error.message}`
                : 'Aucune annonce modifiée. Vérifiez que vous êtes propriétaire et que la règle SQL de modification est appliquée.',
            true
        );
        submitButton.disabled = false;
        return;
    }

    cancelPropertyEdit(false);
    setStatus(editPropertyStatus, 'Annonce modifiée.');
    submitButton.disabled = false;
    await loadProperties();
});

document.getElementById('cancelEditButton').addEventListener('click', cancelPropertyEdit);

window.deleteProperty = async function(id) {
    const property = properties.find(item => item.id === id);
    if (!property || !currentUser || !confirm('Voulez-vous supprimer cette annonce ?')) {
        return;
    }

    setStatus(myPropertiesStatus, 'Suppression en cours…');
    let deleteQuery = supabase
        .from('properties')
        .delete()
        .eq('id', id);
    if (!isAdmin()) {
        deleteQuery = deleteQuery.eq('created_by', currentUser.id);
    }
    const { data, error } = await deleteQuery.select('id').maybeSingle();
    if (error) {
        setStatus(
            myPropertiesStatus,
            `Supabase a refusé la suppression : ${error.message}. Vérifiez que vous êtes connecté au compte propriétaire et réexécutez le SQL de supabase/schema.sql dans l’éditeur SQL Supabase.`,
            true
        );
        return;
    }
    if (!data) {
        setStatus(
            myPropertiesStatus,
            'Aucune annonce supprimée. Vérifiez que vous êtes connecté au compte propriétaire et réexécutez le SQL de supabase/schema.sql dans l’éditeur SQL Supabase.',
            true
        );
        return;
    }
    if (editingPropertyId === id) {
        cancelPropertyEdit();
    }
    await loadProperties();
    setStatus(myPropertiesStatus, 'Annonce supprimée.');
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
