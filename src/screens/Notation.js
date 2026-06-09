import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';

const Notation = ({ navigation, route }) => {
    const { utilisateur } = route.params || {};
    const [note, setNote] = useState(0);

    const etoiles = [1, 2, 3, 4, 5];

    const soumettrNote = () => {
        if (note === 0) {
            Alert.alert('Erreur', 'Veuillez donner une note');
            return;
        }

        Alert.alert(
            'Merci !',
            `Vous avez noté le chauffeur ${note}/5 ⭐`,
            [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('AccueilPassager', { utilisateur }),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.titre}>Noter votre chauffeur</Text>
                <Text style={styles.sousTitre}>Comment s'est passée votre course ?</Text>

                {/* Étoiles */}
                <View style={styles.etoilesContainer}>
                    {etoiles.map(e => (
                        <TouchableOpacity key={e} onPress={() => setNote(e)}>
                            <Text style={[styles.etoile, note >= e && styles.etoileActive]}>
                                ⭐
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.noteTexte}>
                    {note === 0 && 'Appuyez sur une étoile'}
                    {note === 1 && 'Mauvais 😞'}
                    {note === 2 && 'Passable 😐'}
                    {note === 3 && 'Bien 🙂'}
                    {note === 4 && 'Très bien 😊'}
                    {note === 5 && 'Excellent ! 🤩'}
                </Text>

                <TouchableOpacity style={styles.bouton} onPress={soumettrNote}>
                    <Text style={styles.boutonTexte}>Soumettre la note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.boutonIgnorer}
                    onPress={() => navigation.navigate('AccueilPassager', { utilisateur })}>
                    <Text style={styles.boutonIgnorerTexte}>Ignorer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 4,
        alignItems: 'center',
    },
    titre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    sousTitre: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
        textAlign: 'center',
    },
    etoilesContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    etoile: {
        fontSize: 40,
        marginHorizontal: 4,
        opacity: 0.3,
    },
    etoileActive: {
        opacity: 1,
    },
    noteTexte: {
        fontSize: 16,
        color: '#555',
        marginBottom: 24,
        textAlign: 'center',
    },
    bouton: {
        backgroundColor: '#F5A623',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    boutonTexte: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    boutonIgnorer: {
        padding: 12,
        alignItems: 'center',
    },
    boutonIgnorerTexte: {
        color: '#888',
        fontSize: 14,
    },
});

export default Notation;
