import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import InscriptionScreen from '../screens/Inscription';
import AccueilPassager from '../screens/AccueilPassager';
import SuiviCourse from '../screens/SuiviCourse';
import Notation from '../screens/Notation';
import HistoriqueCourses from '../screens/HistoriqueCourses';
import UrgenceMedicale from '../screens/UrgenceMedicale';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Inscription"
                    component={InscriptionScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AccueilPassager"
                    component={AccueilPassager}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SuiviCourse"
                    component={SuiviCourse}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Notation"
                    component={Notation}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="HistoriqueCourses"
                    component={HistoriqueCourses}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="UrgenceMedicale"
                    component={UrgenceMedicale}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
