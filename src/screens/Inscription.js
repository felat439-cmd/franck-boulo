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

const InscriptionScreen = ({ navigation }) => {
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [motdepasse, setMotdepasse] = useState('');
    const [role, setRole] = useState('passager');
    const [chargement, setChargement] = useState(false);

    const handleInscription = async () => {
        if (!nom || !email || !motdepasse) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (motdepasse.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setChargement(true);

        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, motdepasse);
            const uid = userCredential.user.uid;

            await database().ref(`/utilisateurs/${uid}`).set({
                uid,
                nom,
                email,
                role,
                dateInscription: new Date().toISOString(),
            });

            Alert.alert('Succès', 'Inscription réussie !', [
                { text: 'OK', onPress: () => navigation.navigate('Login') },
            ]);
        } catch (error) {
            let message = 'Erreur lors de l\'inscription';
            if (error.code === 'auth/email-already-in-use') message = 'Email déjà utilisé';
            if (error.code === 'auth/invalid-email') message = 'Email invalide';
            if (error.code === 'auth/weak-password') message = 'Mot de passe trop faible';
            Alert.alert('Erreur', message);
        } finally {
            setChargement(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titre}>Yango Cameroun</Text>
            <Text style={styles.sousTitre}>Inscription</Text>

            <TextInput
                style={styles.input}
                placeholder="Nom complet"
                value={nom}
                onChangeText={setNom}
            />

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
                placeholder="Mot de passe (min. 6 caractères)"
                value={motdepasse}
                onChangeText={setMotdepasse}
                secureTextEntry
            />

            <Text style={styles.label}>Je suis :</Text>
            <View style={styles.roleContainer}>
                <TouchableOpacity
                    style={[styles.roleBtn, role === 'passager' && styles.roleBtnActif]}
                    onPress={() => setRole('passager')}>
                    <Text style={[styles.roleTxt, role === 'passager' && styles.roleTxtActif]}>
                        Passager
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleBtn, role === 'chauffeur' && styles.roleBtnActif]}
                    onPress={() => setRole('chauffeur')}>
                    <Text style={[styles.roleTxt, role === 'chauffeur' && styles.roleTxtActif]}>
                        Chauffeur
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.bouton}
                onPress={handleInscription}
                disabled={chargement}>
                {chargement ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.boutonTexte}>S'inscrire</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.lien}>Déjà un compte ? Se connecter</Text>
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
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    roleBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    roleBtnActif: {
        backgroundColor: '#F5A623',
        borderColor: '#F5A623',
    },
    roleTxt: {
        color: '#333',
        fontSize: 15,
    },
    roleTxtActif: {
        color: '#fff',
        fontWeight: 'bold',
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

export default InscriptionScreen;