import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';

const hopitauxYaounde = [
    {
        id: 1,
        nom: 'Hôpital Central de Yaoundé',
        latitude: 3.8631,
        longitude: 11.5132,
        telephone: '+237 222 23 40 20',
        adresse: 'Rue Henri Dunant, Yaoundé',
    },
    {
        id: 2,
        nom: 'Hôpital Général de Yaoundé',
        latitude: 3.8614,
        longitude: 11.5398,
        telephone: '+237 222 20 36 33',
        adresse: 'Boulevard de l\'URSS, Yaoundé',
    },
    {
        id: 3,
        nom: 'Hôpital Gynéco-Obstétrique',
        latitude: 3.8750,
        longitude: 11.5200,
        telephone: '+237 222 21 34 66',
        adresse: 'Ngousso, Yaoundé',
    },
    {
        id: 4,
        nom: 'Clinique Universitaire',
        latitude: 3.8600,
        longitude: 11.4900,
        telephone: '+237 222 31 69 51',
        adresse: 'Melen, Yaoundé',
    },
];

const premiersSecours = [
    {
        situation: 'Perte de conscience',
        icone: '🧠',
        etapes: [
            'Vérifiez si la personne répond en lui tapotant les épaules',
            'Appelez le 15 ou le 1518 (SAMU Cameroun)',
            'Mettez la personne en position latérale de sécurité (PLS)',
            'Vérifiez sa respiration toutes les minutes',
            'Ne lui donnez rien à boire ni à manger',
        ],
    },
    {
        situation: 'Arrêt cardiaque',
        icone: '❤️',
        etapes: [
            'Appelez immédiatement le 15 ou 1518',
            'Allongez la personne sur le dos sur une surface dure',
            'Placez vos mains au centre de la poitrine',
            'Effectuez 30 compressions rapides et profondes (5cm)',
            'Faites 2 insufflations bouche-à-bouche',
            'Continuez jusqu\'à l\'arrivée des secours',
        ],
    },
    {
        situation: 'Étouffement',
        icone: '🫁',
        etapes: [
            'Demandez à la personne de tousser fort',
            'Donnez 5 claques dans le dos entre les omoplates',
            'Si inefficace, faites la manœuvre de Heimlich',
            'Placez-vous derrière la personne',
            'Serrez fort au niveau du ventre vers le haut',
            'Appelez le 15 si ça ne dégage pas',
        ],
    },
    {
        situation: 'Saignement abondant',
        icone: '🩸',
        etapes: [
            'Appuyez fortement sur la plaie avec un tissu propre',
            'Maintenez la pression sans relâcher',
            'Allongez la personne et surélevez la partie blessée',
            'Appelez le 15 immédiatement',
            'Ne retirez pas le tissu même s\'il est imbibé',
            'Ajoutez un autre tissu par-dessus si nécessaire',
        ],
    },
];

const calculerDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const UrgenceMedicale = ({ navigation, route }) => {
    const { utilisateur, positionPassager } = route.params || {};
    const [etape, setEtape] = useState('accueil');
    const [hopitalProche, setHopitalProche] = useState(null);
    const [situationChoisie, setSituationChoisie] = useState(null);
    const [chargement, setChargement] = useState(false);

    const webViewRef = useRef(null);

    // C'est bien le PASSAGER qui subit l'urgence, on se base sur sa position reçue
    const positionActuelle = {
        latitude: positionPassager?.latitude || 3.848,
        longitude: positionPassager?.longitude || 11.5021,
    };

    const trouverHopitalProche = () => {
        setChargement(true);
        let hopitalLePlusProche = null;
        let distanceMin = Infinity;

        // Boucle de recherche dynamique
        hopitauxYaounde.forEach(hopital => {
            const distance = calculerDistance(
                positionActuelle.latitude,
                positionActuelle.longitude,
                hopital.latitude,
                hopital.longitude
            );
            if (distance < distanceMin) {
                distanceMin = distance;
                hopitalLePlusProche = { ...hopital, distance: distance.toFixed(1) };
            }
        });

        setTimeout(() => {
            setHopitalProche(hopitalLePlusProche);
            setChargement(false);
            setEtape('hopital');
        }, 800);
    };

    const demarrerUrgence = () => {
        Alert.alert(
            '🚨 Mode Urgence Médicale',
            'Rechercher l\'hôpital le plus proche de votre position ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Confirmer', onPress: trouverHopitalProche },
            ]
        );
    };

    // FONCTION DYNAMIQUE : Génère le code HTML unique pour l'hôpital trouvé
    const genererCarteHTML = (hopital) => {
        if (!hopital) return '';
        return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${positionActuelle.latitude}, ${positionActuelle.longitude}], 13);
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map);

            // Position du Passager en détresse
            var userMarker = L.marker([${positionActuelle.latitude}, ${positionActuelle.longitude}])
              .addTo(map)
              .bindPopup('🚨 Ma Position (Passager)')
              .openPopup();

            // Position de l'Hôpital trouvé
            var hospMarker = L.marker([${hopital.latitude}, ${hopital.longitude}])
              .addTo(map)
              .bindPopup('🏥 ${hopital.nom}');

            // Ligne rouge d'évacuation médicale d'urgence
            var routeLine = L.polyline([
              [${positionActuelle.latitude}, ${positionActuelle.longitude}],
              [${hopital.latitude}, ${hopital.longitude}]
            ], {color: '#E53935', weight: 6}).addTo(map);

            try {
              map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
            } catch(e) {
              map.setView([${positionActuelle.latitude}, ${positionActuelle.longitude}], 13);
            }
          </script>
        </body>
        </html>
      `;
    };

    if (etape === 'accueil') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.retour}>← Retour</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitre}>Urgence Médicale</Text>
                </View>
                <ScrollView style={styles.body}>
                    <TouchableOpacity style={styles.boutonSOS} onPress={demarrerUrgence}>
                        <Text style={styles.sosIcon}>🚨</Text>
                        <Text style={styles.sosTitre}>URGENCE</Text>
                        <Text style={styles.sosSub}>Trouver l'hôpital le plus proche</Text>
                    </TouchableOpacity>
                    <Text style={styles.sectionTitre}>Premiers secours</Text>
                    <Text style={styles.sectionSub}>Choisissez la situation</Text>
                    {premiersSecours.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.situationCard}
                            onPress={() => {
                                setSituationChoisie(item);
                                setEtape('secours');
                            }}>
                            <Text style={styles.situationIcon}>{item.icone}</Text>
                            <View style={styles.containerNom}>
                                <Text style={styles.situationNom}>{item.situation}</Text>
                            </View>
                            <Text style={styles.situationArrow}>→</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (etape === 'hopital') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setEtape('accueil')}>
                        <Text style={styles.retour}>← Retour</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitre}>Hôpital le plus proche</Text>
                </View>

                {/* L'utilisation combinée de key et genererCarteHTML() force la WebView à casser le cache statique */}
                <WebView
                    key={hopitalProche ? hopitalProche.id : 'map-empty'}
                    ref={webViewRef}
                    style={styles.carte}
                    source={{ html: genererCarteHTML(hopitalProche) }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />

                <View style={styles.panelUrgence}>
                    <View style={styles.urgenceBadge}>
                        <Text style={styles.urgenceBadgeTxt}>🚨 Plus proche établissement trouvé</Text>
                    </View>
                    {hopitalProche && (
                        <>
                            <Text style={styles.hopitalNom}>{hopitalProche.nom}</Text>
                            <Text style={styles.hopitalAdresse}>📍 {hopitalProche.adresse}</Text>
                            <Text style={styles.hopitalDistance}>🚖 À {hopitalProche.distance} km de votre position</Text>
                            <Text style={styles.hopitalTel}>📞 {hopitalProche.telephone}</Text>
                        </>
                    )}
                    <TouchableOpacity
                        style={styles.boutonSecours}
                        onPress={() => {
                            setSituationChoisie(premiersSecours[0]);
                            setEtape('secours');
                        }}>
                        <Text style={styles.boutonSecoursTexte}>Voir les premiers secours</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (etape === 'secours') {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { backgroundColor: '#E53935' }]}>
                    <TouchableOpacity onPress={() => setEtape('accueil')}>
                        <Text style={styles.retour}>← Retour</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitre}>
                        {situationChoisie?.icone} {situationChoisie?.situation}
                    </Text>
                </View>
                <ScrollView style={styles.body}>
                    <Text style={styles.secoursTitre}>Instructions de premiers secours</Text>
                    {situationChoisie?.etapes.map((etapeItem, index) => (
                        <View key={index} style={styles.etapeCard}>
                            <View style={styles.etapeNumero}>
                                <Text style={styles.etapeNumeroTxt}>{index + 1}</Text>
                            </View>
                            <Text style={styles.etapeTxt}>{etapeItem}</Text>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.boutonSOS} onPress={demarrerUrgence}>
                        <Text style={styles.sosIcon}>🚨</Text>
                        <Text style={styles.sosTitre}>TROUVER UN HÔPITAL</Text>
                        <Text style={styles.sosSub}>Hôpital le plus proche</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#E53935', padding: 24, paddingTop: 48 },
    retour: { color: '#fff', fontSize: 14, marginBottom: 4 },
    headerTitre: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    body: { flex: 1, padding: 16 },
    carte: { flex: 1 },
    boutonSOS: {
        backgroundColor: '#E53935', borderRadius: 16, padding: 24,
        alignItems: 'center', marginBottom: 20, elevation: 4,
    },
    sosIcon: { fontSize: 40, marginBottom: 8 },
    sosTitre: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    sosSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    sectionTitre: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    sectionSub: { fontSize: 13, color: '#888', marginBottom: 12 },
    situationCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16,
        marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2,
    },
    situationIcon: { fontSize: 24, marginRight: 12 },
    containerNom: { flex: 1 },
    situationNom: { fontSize: 15, color: '#333', fontWeight: 'bold' },
    situationArrow: { fontSize: 18, color: '#E53935' },
    panelUrgence: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
    urgenceBadge: {
        backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10,
        alignItems: 'center', marginBottom: 12,
    },
    urgenceBadgeTxt: { color: '#E53935', fontWeight: 'bold', fontSize: 14 },
    hopitalNom: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
    hopitalAdresse: { fontSize: 14, color: '#555', marginBottom: 4 },
    hopitalDistance: { fontSize: 14, color: '#F5A623', fontWeight: 'bold', marginBottom: 4 },
    hopitalTel: { fontSize: 15, color: '#E53935', fontWeight: 'bold', marginBottom: 16 },
    boutonSecours: {
        backgroundColor: '#E53935', padding: 16, borderRadius: 8, alignItems: 'center',
    },
    boutonSecoursTexte: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    secoursTitre: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    etapeCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14,
        marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', elevation: 2,
    },
    etapeNumero: {
        backgroundColor: '#E53935', width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    etapeNumeroTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    etapeTxt: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
});

export default UrgenceMedicale;