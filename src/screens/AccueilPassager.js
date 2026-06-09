import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';

const AccueilPassager = ({ navigation, route }) => {
    const { utilisateur } = route.params || {};
    const [destination, setDestination] = useState('');
    const [chargement, setChargement] = useState(false);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [recherche, setRecherche] = useState(false);
    const [position, setPosition] = useState({
        latitude: 3.848,
        longitude: 11.5021,
    });
    const webViewRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        demanderPermission();

        // Nettoyage de la puce GPS quand on ferme l'écran
        return () => {
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const demanderPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Permission de localisation',
                    message: 'Yango a besoin d\'accéder à votre position',
                    buttonPositive: 'Autoriser',
                    buttonNegative: 'Refuser',
                }
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                obtenirPosition();
            }
        } catch (err) {
            console.log(err);
        }
    };

    const obtenirPosition = () => {
        // 1. Position initiale immédiate
        Geolocation.getCurrentPosition(
            pos => {
                const nouvellePosition = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                };
                setPosition(nouvellePosition);

                // Envoi initial à Firebase Realtime Database
                const userId = utilisateur?.uid || 'inconnu';
                if (userId !== 'inconnu') {
                    database()
                        .ref(`/trajets/passagers/${userId}`)
                        .set({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            nom: utilisateur?.nom || 'Passager',
                            timestamp: database.ServerValue.TIMESTAMP,
                        })
                        .catch(err => console.log('Erreur Firebase initiale:', err));
                }

                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        if (typeof userMarker !== 'undefined') {
                          userMarker.setLatLng([${pos.coords.latitude}, ${pos.coords.longitude}]);
                          map.setView([${pos.coords.latitude}, ${pos.coords.longitude}], 14);
                        }
                        true;
                    `);
                }
            },
            error => console.log(error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        // 2. Écoute en temps réel avec mise à jour Firebase
        watchIdRef.current = Geolocation.watchPosition(
            pos => {
                const nouvellePosition = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                };
                setPosition(nouvellePosition);

                // Mise à jour continue sur Firebase si le passager bouge
                const userId = utilisateur?.uid || 'inconnu';
                if (userId !== 'inconnu') {
                    database()
                        .ref(`/trajets/passagers/${userId}`)
                        .update({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            timestamp: database.ServerValue.TIMESTAMP,
                        })
                        .catch(err => console.log('Erreur mise à jour Firebase:', err));
                }

                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        if (typeof userMarker !== 'undefined') {
                          userMarker.setLatLng([${pos.coords.latitude}, ${pos.coords.longitude}]);
                        }
                        if (typeof routeLine !== 'undefined' && routeLine) {
                          routeLine.setLatLngs([
                            [${pos.coords.latitude}, ${pos.coords.longitude}],
                            routeLine.getLatLngs()[1]
                          ]);
                        }
                        true;
                    `);
                }
            },
            error => console.log(error),
            { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
        );
    };

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
        var destMarker;
        var routeLine;
      </script>
    </body>
    </html>
  `;

    const rechercherDestination = async () => {
        if (!destination) return;
        setRecherche(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination + ' Yaoundé Cameroun')}&format=json&limit=1`,
                { headers: { 'User-Agent': 'YangoApp/1.0' } }
            );
            const data = await response.json();

            if (data.length > 0) {
                const coords = {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                };
                setDestinationCoords(coords);

                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        if (typeof destMarker !== 'undefined' && destMarker) {
                          map.removeLayer(destMarker);
                        }
                        if (typeof routeLine !== 'undefined' && routeLine) {
                          map.removeLayer(routeLine);
                        }
                        destMarker = L.marker([${coords.latitude}, ${coords.longitude}])
                          .addTo(map)
                          .bindPopup('🏁 ${destination}')
                          .openPopup();
                        routeLine = L.polyline([
                          [${position.latitude}, ${position.longitude}],
                          [${coords.latitude}, ${coords.longitude}]
                        ], {color: 'green', weight: 5, dashArray: '10, 5'}).addTo(map);
                        map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
                        true;
                    `);
                }
                Alert.alert('✅ Destination trouvée !', `${destination} localisée sur la carte.`);
            } else {
                Alert.alert('Introuvable', 'Destination non trouvée. Essayez un nom plus précis.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de rechercher la destination');
        } finally {
            setRecherche(false);
        }
    };

    const demanderCourse = async () => {
        if (!destination) {
            Alert.alert('Erreur', 'Veuillez entrer une destination');
            return;
        }

        if (!destinationCoords) {
            Alert.alert('Attention', 'Veuillez d\'abord rechercher la destination avec 🔍');
            return;
        }

        setChargement(true);

        try {
            const nouvelleCourse = {
                passagerId: utilisateur?.uid || 'inconnu',
                passagerNom: utilisateur?.nom || 'Passager',
                depart: 'Yaoundé Centre',
                destination,
                destinationLatitude: destinationCoords.latitude,
                destinationLongitude: destinationCoords.longitude,
                statut: 'en_attente',
                chauffeurId: null,
                dateCreation: new Date().toISOString(),
                latitude: position.latitude,
                longitude: position.longitude,
            };

            const ref = await database().ref('/courses').push(nouvelleCourse);
            const courseId = ref.key;

            navigation.navigate('SuiviCourse', {
                course: { ...nouvelleCourse, id: courseId },
                utilisateur,
            });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer la course');
        } finally {
            setChargement(false);
        }
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

            <TouchableOpacity
                style={styles.boutonSOS}
                onPress={() => navigation.navigate('UrgenceMedicale', {
                    utilisateur,
                    positionPassager: position,
                })}>
                <Text style={styles.sosTexte}>🚨 SOS</Text>
            </TouchableOpacity>

            <View style={styles.panel}>
                <View style={styles.panelHeader}>
                    <View>
                        <Text style={styles.titre}>Bonjour {utilisateur?.nom || 'Passager'} 👋</Text>
                        <Text style={styles.sousTitre}>Où voulez-vous aller ?</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('HistoriqueCourses', { utilisateur })}>
                        <Text style={styles.historique}>📋 Historique</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Entrez votre destination"
                        value={destination}
                        onChangeText={text => {
                            setDestination(text);
                            setDestinationCoords(null);
                        }}
                        onSubmitEditing={rechercherDestination}
                    />
                    <TouchableOpacity
                        style={styles.boutonRecherche}
                        onPress={rechercherDestination}
                        disabled={recherche}>
                        {recherche ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.boutonRechercheTexte}>🔍</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {destinationCoords && (
                    <Text style={styles.destinationTrouvee}>
                        ✅ Ligne verte tracée vers {destination} !
                    </Text>
                )}

                <TouchableOpacity
                    style={styles.bouton}
                    onPress={demanderCourse}
                    disabled={chargement}>
                    {chargement ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.boutonTexte}>Demander une course 🚖</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.boutonSecondaire}
                    onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.boutonSecondaireTexte}>Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    carte: { flex: 1 },
    boutonSOS: {
        position: 'absolute',
        top: 50,
        right: 16,
        backgroundColor: '#E53935',
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 6,
        zIndex: 999,
    },
    sosTexte: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    panel: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 10,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titre: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    sousTitre: { fontSize: 12, color: '#888' },
    historique: { color: '#F5A623', fontSize: 13, fontWeight: 'bold' },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
    },
    boutonRecherche: {
        backgroundColor: '#F5A623',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
    },
    boutonRechercheTexte: { fontSize: 18 },
    destinationTrouvee: {
        color: '#4CAF50',
        fontSize: 13,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    bouton: {
        backgroundColor: '#F5A623',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    boutonTexte: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    boutonSecondaire: { padding: 10, alignItems: 'center' },
    boutonSecondaireTexte: { color: '#888', fontSize: 14 },
});

export default AccueilPassager;