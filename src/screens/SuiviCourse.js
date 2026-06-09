import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import database from '@react-native-firebase/database';

const SuiviCourse = ({ navigation, route }) => {
    const { course, utilisateur } = route.params || {};
    const [statut, setStatut] = useState(course?.statut || 'en_attente');
    const [chauffeurNom, setChauffeurNom] = useState(null);
    const [position, setPosition] = useState({
        latitude: course?.latitude || 3.848,
        longitude: course?.longitude || 11.5021,
    });
    const [destLat, setDestLat] = useState(course?.destinationLatitude || 3.86);
    const [destLng, setDestLng] = useState(course?.destinationLongitude || 11.51);
    const webViewRef = useRef(null);

    const statutTexte = {
        en_attente: 'Recherche d\'un chauffeur...',
        acceptee: 'Chauffeur en route vers vous',
        en_cours: 'Course en cours',
        terminee: 'Course terminée',
    };

    const statutCouleur = {
        en_attente: '#F5A623',
        acceptee: '#2196F3',
        en_cours: '#4CAF50',
        terminee: '#9E9E9E',
    };

    useEffect(() => {
        if (!course?.id) return;

        const ref = database().ref(`/courses/${course.id}`);
        ref.on('value', async snapshot => {
            const data = snapshot.val();
            if (data) {
                setStatut(data.statut);

                if (data.destinationLatitude) setDestLat(data.destinationLatitude);
                if (data.destinationLongitude) setDestLng(data.destinationLongitude);

                if (data.chauffeurId) {
                    const chauffeurSnap = await database()
                        .ref(`/utilisateurs/${data.chauffeurId}`)
                        .once('value');
                    const chauffeur = chauffeurSnap.val();
                    if (chauffeur) setChauffeurNom(chauffeur.nom);
                }

                if (data.statut === 'terminee') {
                    Alert.alert(
                        'Course terminée !',
                        'Vous êtes arrivé à destination.',
                        [{ text: 'Noter le chauffeur', onPress: () => navigation.navigate('Notation', { utilisateur }) }]
                    );
                }
            }
        });

        return () => ref.off();
    }, [course?.id]);

    // Géolocalisation en temps réel
    useEffect(() => {
        const watchId = setInterval(() => {
            navigator.geolocation?.getCurrentPosition(
                pos => {
                    const nouvellePosition = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    };
                    setPosition(nouvellePosition);

                    if (webViewRef.current) {
                        webViewRef.current.injectJavaScript(`
              if (typeof userMarker !== 'undefined') {
                userMarker.setLatLng([${pos.coords.latitude}, ${pos.coords.longitude}]);
              }
              if (typeof routeLine !== 'undefined') {
                routeLine.setLatLngs([
                  [${pos.coords.latitude}, ${pos.coords.longitude}],
                  [${destLat}, ${destLng}]
                ]);
              }
              true;
            `);
                    }
                },
                () => { },
                { enableHighAccuracy: true, timeout: 15000 }
            );
        }, 5000);

        return () => clearInterval(watchId);
    }, [destLat, destLng]);

    const carteHTML = `
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
        var map = L.map('map').setView([${position.latitude}, ${position.longitude}], 14);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var userMarker = L.marker([${position.latitude}, ${position.longitude}])
          .addTo(map)
          .bindPopup('📍 Votre position')
          .openPopup();

        var destMarker = L.marker([${destLat}, ${destLng}])
          .addTo(map)
          .bindPopup('🏁 ${course?.destination || 'Destination'}');

        var routeLine = L.polyline([
          [${position.latitude}, ${position.longitude}],
          [${destLat}, ${destLng}]
        ], {color: 'green', weight: 5, dashArray: '10, 5'}).addTo(map);

        map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
      </script>
    </body>
    </html>
  `;

    const annulerCourse = async () => {
        Alert.alert(
            'Annuler la course ?',
            'Voulez-vous vraiment annuler ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui',
                    onPress: async () => {
                        await database()
                            .ref(`/courses/${course.id}`)
                            .update({ statut: 'annulee' });
                        navigation.navigate('AccueilPassager', { utilisateur });
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={styles.carte}
                source={{ html: carteHTML }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

            <View style={styles.panel}>
                <View style={[styles.statutBadge, { backgroundColor: statutCouleur[statut] }]}>
                    <Text style={styles.statutTexte}>{statutTexte[statut]}</Text>
                </View>

                {chauffeurNom && statut !== 'en_attente' && (
                    <Text style={styles.chauffeurNom}>🧑‍✈️ Chauffeur : {chauffeurNom}</Text>
                )}

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitre}>Détails de la course</Text>
                    <Text style={styles.infoTexte}>📍 Départ : {course?.depart || 'Yaoundé Centre'}</Text>
                    <Text style={styles.infoTexte}>🏁 Destination : {course?.destination || 'Destination'}</Text>
                </View>

                {statut === 'terminee' ? (
                    <TouchableOpacity
                        style={styles.bouton}
                        onPress={() => navigation.navigate('Notation', { utilisateur })}>
                        <Text style={styles.boutonTexte}>Noter le chauffeur ⭐</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.boutonAnnuler} onPress={annulerCourse}>
                        <Text style={styles.boutonAnnulerTexte}>Annuler la course</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    carte: { flex: 1 },
    panel: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 10,
    },
    statutBadge: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    statutTexte: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    chauffeurNom: {
        textAlign: 'center',
        color: '#333',
        fontSize: 14,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
    },
    infoTitre: { fontWeight: 'bold', fontSize: 15, color: '#333', marginBottom: 8 },
    infoTexte: { color: '#555', fontSize: 14, marginBottom: 4 },
    bouton: {
        backgroundColor: '#F5A623',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    boutonTexte: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    boutonAnnuler: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    boutonAnnulerTexte: { color: '#888', fontSize: 14 },
});

export default SuiviCourse;