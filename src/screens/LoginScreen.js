import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [motdepasse, setMotdepasse] = useState('');
    const [chargement, setChargement] = useState(false);

    const handleConnexion = async () => {
        if (!email || !motdepasse) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setChargement(true);

        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, motdepasse);
            const uid = userCredential.user.uid;

            const snapshot = await database()
                .ref(`/utilisateurs/${uid}`)
                .once('value');

            const utilisateur = snapshot.val();

            // Redirection directe vers AccueilPassager
            navigation.navigate('AccueilPassager', { utilisateur: { ...utilisateur, uid } });
        } catch (error) {
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') message = 'Utilisateur introuvable';
            if (error.code === 'auth/wrong-password') message = 'Mot de passe incorrect';
            if (error.code === 'auth/invalid-email') message = 'Email invalide';
            if (error.code === 'auth/invalid-credential') message = 'Email ou mot de passe incorrect';
            Alert.alert('Erreur', message);
        } finally {
            setChargement(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titre}>Yango Cameroun</Text>
            <Text style={styles.sousTitre}>Connexion</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={motdepasse}
                onChangeText={setMotdepasse}
                secureTextEntry
            />

            <TouchableOpacity
                style={styles.bouton}
                onPress={handleConnexion}
                disabled={chargement}>
                {chargement ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.boutonTexte}>Se connecter</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
                <Text style={styles.lien}>Pas de compte ? S'inscrire</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#fff',
    },
    titre: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F5A623',
        textAlign: 'center',
        marginBottom: 8,
    },
    sousTitre: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 40,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
    },
    bouton: {
        backgroundColor: '#F5A623',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    boutonTexte: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    lien: {
        textAlign: 'center',
        color: '#F5A623',
        fontSize: 14,
    },
});

export default LoginScreen;