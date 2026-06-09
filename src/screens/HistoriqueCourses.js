import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import database from '@react-native-firebase/database';
import { calculerGain, formatGain } from '../utils/gainCalculator';

const HistoriqueCourses = ({ navigation, route }) => {
    const { utilisateur } = route.params || {};
    const [courses, setCourses] = useState([]);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        const ref = database().ref('/courses');
        ref.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                const toutesLesCourses = Object.entries(data)
                    .map(([id, valeur]) => ({ ...valeur, id }))
                    .filter(c => {
                        if (utilisateur?.role === 'passager') {
                            return c.passagerId === utilisateur?.uid &&
                                (c.statut === 'terminee' || c.statut === 'annulee');
                        } else {
                            return c.chauffeurId === utilisateur?.uid &&
                                (c.statut === 'terminee' || c.statut === 'annulee');
                        }
                    })
                    .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
                setCourses(toutesLesCourses);
            } else {
                setCourses([]);
            }
            setChargement(false);
        });

        return () => ref.off();
    }, []);

    const formatDate = dateString => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const renderCourse = ({ item }) => {
        const gain = item.gain || calculerGain(item.distance || 0);
        const afficherGain = item.statut === 'terminee' ? formatGain(gain) : '0 FCFA';
        
        return (
            <View style={styles.courseCard}>
                <View style={styles.courseHeader}>
                    <Text style={styles.courseDate}>{formatDate(item.dateCreation)}</Text>
                    <View style={[
                        styles.statutBadge,
                        { backgroundColor: item.statut === 'terminee' ? '#4CAF50' : '#E53935' }
                    ]}>
                        <Text style={styles.statutTexte}>
                            {item.statut === 'terminee' ? '✅ Terminée' : '❌ Annulée'}
                        </Text>
                    </View>
                </View>

                <View style={styles.courseInfo}>
                    <Text style={styles.infoTexte}>📍 {item.depart}</Text>
                    <Text style={styles.infoTexte}>🏁 {item.destination}</Text>
                    <Text style={styles.infoTexte}>📏 {(item.distance || 0).toFixed(1)} km</Text>
                </View>

                <View style={styles.courseFooter}>
                    <Text style={styles.prix}>
                        {afficherGain}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.retour}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.titre}>Historique des courses</Text>
            </View>

            {chargement ? (
                <ActivityIndicator color="#F5A623" size="large" style={styles.loader} />
            ) : courses.length === 0 ? (
                <View style={styles.vide}>
                    <Text style={styles.videTexte}>Aucune course dans l'historique</Text>
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderCourse}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.liste}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#F5A623',
        padding: 24,
        paddingTop: 48,
    },
    retour: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    titre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    liste: {
        padding: 16,
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    courseDate: {
        color: '#888',
        fontSize: 13,
    },
    statutBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statutTexte: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    courseInfo: {
        marginBottom: 12,
    },
    infoTexte: {
        color: '#333',
        fontSize: 14,
        marginBottom: 4,
    },
    courseFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    prix: {
        color: '#F5A623',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loader: {
        marginTop: 40,
    },
    vide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    videTexte: {
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
    },
});

export default HistoriqueCourses;