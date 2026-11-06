// Sélection des éléments du DOM
const propertyGrid = document.getElementById('propertyGrid');
const propertyForm = document.getElementById('propertyForm');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const emptyState = document.getElementById('emptyState');
const counter = document.getElementById('counter');

const bookingModal = document.getElementById('bookingModal');
const modalPropertyTitle = document.getElementById('modalPropertyTitle');
const modalPrice = document.getElementById('modalPrice');
const paymentForm = document.getElementById('paymentForm');

let selectedProperty = null;

// Données initiales par défaut au Burkina Faso
let properties = JSON.parse(localStorage.getItem('burkina_properties')) || [
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

// Fonction pour afficher les logements
function renderProperties(data = properties) {
    propertyGrid.innerHTML = '';
    counter.textContent = `${data.length} bien(s) trouvé(s)`;

    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    data.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col justify-between hover:shadow-md transition';
        card.innerHTML = `
            <div>
                <div class="relative h-48 bg-gray-200 overflow-hidden">
                    <img src="${prop.image}" alt="${prop.title}" class="w-full h-full object-cover">
                    <span class="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow">
                        ${prop.type}
                    </span>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-lg text-gray-800 mb-1">${prop.title}</h3>
                    <p class="text-sm text-gray-500 mb-3"><i class="fa-solid fa-location-dot text-emerald-600 mr-1"></i> ${prop.location}</p>
                    <div class="text-emerald-700 font-extrabold text-lg mb-4">
                        ${Number(prop.price).toLocaleString()} FCFA <span class="text-xs font-normal text-gray-500">/ mois</span>
                    </div>
                </div>
            </div>
            <div class="px-5 pb-5 pt-0 flex flex-col gap-2">
                <button onclick="openModal(${prop.id})" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2 px-3 rounded-lg text-sm font-semibold transition shadow-sm">
                    <i class="fa-solid fa-bookmark mr-1"></i> Réserver & Payer
                </button>
                <div class="flex gap-2">
                    <a href="tel:${prop.contact}" class="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-center py-2 px-3 rounded-lg text-sm font-semibold transition">
                        <i class="fa-solid fa-phone mr-1"></i> Appeler
                    </a>
                    <button onclick="deleteProperty(${prop.id})" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Supprimer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        propertyGrid.appendChild(card);
    });
}

// Ouvrir la modale de paiement
window.openModal = function(id) {
    selectedProperty = properties.find(p => p.id === id);
    if (selectedProperty) {
        modalPropertyTitle.textContent = selectedProperty.title + ' (' + selectedProperty.location + ')';
        modalPrice.value = Number(selectedProperty.price).toLocaleString() + ' FCFA';
        bookingModal.classList.remove('hidden');
    }
}

// Fermer la modale
window.closeModal = function() {
    bookingModal.classList.add('hidden');
    paymentForm.reset();
}

// Gestion du formulaire de paiement
paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const operator = document.querySelector('input[name="operator"]:checked').value;
    const phone = document.getElementById('payerPhone').value;

    alert(`Demande de paiement envoyée !\n\nUn code de validation ${operator} a été envoyé au ${phone} pour la réservation de : "${selectedProperty.title}".\n\n(Simulation réussie)`);
    closeModal();
});

// Ajouter un bien avec gestion de l'image locale
propertyForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const imageInput = document.getElementById('imageFile');
    const file = imageInput.files[0];
    const imageUrl = document.getElementById('image').value.trim();

    if (!file && !imageUrl) {
        alert('Ajoutez une photo ou renseignez le lien de la photo.');
        return;
    }

    const addProperty = image => {
        const newProp = {
            id: Date.now(),
            title: document.getElementById('title').value.trim(),
            type: document.getElementById('type').value,
            location: document.getElementById('location').value.trim(),
            price: Number(document.getElementById('price').value),
            image,
            contact: document.getElementById('contact').value.trim()
        };

        const updatedProperties = [newProp, ...properties];
        try {
            localStorage.setItem('burkina_properties', JSON.stringify(updatedProperties));
        } catch (error) {
            console.error('Impossible d’enregistrer cette annonce dans le navigateur.', error);
            alert('L’annonce n’a pas pu être enregistrée dans ce navigateur. Essayez avec un lien de photo au lieu d’un fichier volumineux.');
            return;
        }

        properties = updatedProperties;
        propertyForm.reset();
        filterAndRender();
        alert('Annonce ajoutée. Elle est enregistrée dans ce navigateur.');
    };

    if (!file) {
        addProperty(imageUrl);
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        if (typeof reader.result !== 'string') {
            alert('La photo n’a pas pu être lue. Réessayez ou utilisez un lien de photo.');
            return;
        }
        addProperty(reader.result);
    };
    reader.onerror = function() {
        alert('La photo n’a pas pu être lue. Réessayez ou utilisez un lien de photo.');
    };
    reader.readAsDataURL(file);
});

// Supprimer un bien
window.deleteProperty = function(id) {
    if (confirm('Voulez-vous supprimer cette annonce ?')) {
        properties = properties.filter(p => p.id !== id);
        localStorage.setItem('burkina_properties', JSON.stringify(properties));
        filterAndRender();
    }
}

// Filtrer et afficher
function filterAndRender() {
    const query = searchInput.value.toLowerCase();
    const selectedType = filterType.value;

    const filtered = properties.filter(p => {
        const matchText = p.title.toLowerCase().includes(query) || p.location.toLowerCase().includes(query);
        const matchType = selectedType === "" || p.type === selectedType;
        return matchText && matchType;
    });

    renderProperties(filtered);
}

searchInput.addEventListener('input', filterAndRender);
filterType.addEventListener('change', filterAndRender);

// Lancement initial
renderProperties();