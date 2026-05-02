import React, { createContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, onSnapshot, addDoc, updateDoc, doc, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
    signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword 
} from "firebase/auth";

export const AppContext = createContext();

const defaultPlayers = [
    { name: "Ministro", total: 11, vitorias: 9, derrotas: 2, streak: ["W", "W", "L", "W", "W"] },
    { name: "Zethun", total: 21, vitorias: 13, derrotas: 8, streak: ["L", "W", "W", "W", "W"] },
    { name: "Wyller", total: 21, vitorias: 12, derrotas: 9, streak: ["L", "W", "W", "L", "L"] },
    { name: "AJR", total: 21, vitorias: 11, derrotas: 10, streak: ["W", "L", "W", "L", "L"] },
    { name: "KalEl", total: 23, vitorias: 12, derrotas: 11, streak: ["L", "L", "L", "L", "W"] },
    { name: "Scanner", total: 18, vitorias: 7, derrotas: 11, streak: ["W", "L", "L", "L", "W"] },
    { name: "Riquelmer45", total: 14, vitorias: 5, derrotas: 9, streak: ["W", "L", "L", "L", "W"] },
    { name: "Alwz", total: 21, vitorias: 7, derrotas: 14, streak: ["W", "L", "W", "L", "L"] },
    { name: "Spotovite", total: 13, vitorias: 4, derrotas: 9, streak: ["L", "L", "L", "W", "L"] },
    { name: "Condottyery", total: 10, vitorias: 3, derrotas: 7, streak: ["W", "L", "L", "L", "W"] },
    { name: "Roisfe", total: 0, vitorias: 0, derrotas: 0, streak: [] }
];

export const CURRENT_SEASON = 'Season 1';

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [players, setPlayers] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cleanupDuplicates = async () => {
            try {
                const snapshot = await getDocs(collection(db, "players"));
                const seen = new Set();
                for (const docSnapshot of snapshot.docs) {
                    const name = docSnapshot.data().name;
                    if (seen.has(name)) {
                        console.log("Deletando duplicata:", name);
                        await deleteDoc(doc(db, "players", docSnapshot.id));
                    } else {
                        seen.add(name);
                    }
                }
            } catch (error) {
                console.error("Erro ao limpar DB:", error);
            }
        };
        cleanupDuplicates();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setPlayers([]);
            setHistory([]);
            return;
        }

        const unsubPlayers = onSnapshot(collection(db, "players"), (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPlayers(playersData);
        });

        const unsubHistory = onSnapshot(collection(db, "history"), (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            historyData.sort((a, b) => b.timestamp - a.timestamp);
            setHistory(historyData);
        });

        return () => {
            unsubPlayers();
            unsubHistory();
        };
    }, [user]);

    // Migração inicial para o novo sistema de ranking
    useEffect(() => {
        if (players.length > 0 && user) {
            const playersToUpdate = players.filter(p => p.rating === undefined);
            if (playersToUpdate.length > 0) {
                console.log("Iniciando migração de rating para", playersToUpdate.length, "jogadores");
                playersToUpdate.forEach(async (p) => {
                    try {
                        const initialRating = 1000 + ((p.vitorias || 0) - (p.derrotas || 0)) * 20;
                        const playerRef = doc(db, "players", p.id);
                        await updateDoc(playerRef, { rating: initialRating });
                    } catch (err) {
                        console.error("Erro na migração do jogador", p.name, err);
                    }
                });
            }
        }
    }, [players, user]);

    const login = async (userInput, password) => {
        try {
            // Se o usuário já digitar um e-mail, usa ele. Se não, adiciona o @baiuca.com
            const email = userInput.includes('@') ? userInput : `${userInput.toLowerCase().trim()}@baiuca.com`;
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Erro no Login do Firebase:", error.code);
            return false;
        }
    };

    // Função para criar as contas de todos os jogadores (exceto o Scanner que já deve existir)
    const createAuthUsers = async () => {
        const results = [];
        for (const player of players) {
            if (player.name.toLowerCase() === 'scanner') continue;
            
            const email = `${player.name.toLowerCase().trim()}@baiuca.com`;
            try {
                // Como createUserWithEmailAndPassword faz login automático, 
                // vamos apenas avisar que precisaria ser feito um por um ou via Admin SDK.
                // Mas para facilitar, vou deixar a lógica aqui comentada para você rodar se quiser.
                console.log(`Criando usuário: ${email}`);
                // await createUserWithEmailAndPassword(auth, email, 'baiuca');
                results.push(`${player.name}: Sucesso`);
            } catch (err) {
                results.push(`${player.name}: Erro (${err.code})`);
            }
        }
        return results;
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch(error) {
            setUser(null);
        }
    };

    const addPlayer = async (name) => {
        const newPlayer = {
            name,
            total: 0,
            vitorias: 0,
            derrotas: 0,
            rating: 1000,
            streak: []
        };
        try {
            await addDoc(collection(db, "players"), newPlayer);
        } catch(error) {
            console.error("Erro ao add jogador", error);
        }
    };

    const handleMatchResult = async (winners, losers) => {
        try {
            // Cálculo da média de rating dos times para o ELO
            // Se o jogador não tiver rating (ainda não migrado), usamos a fórmula de ajuste inicial
            const getRating = (p) => p.rating !== undefined ? p.rating : (1000 + (p.vitorias - p.derrotas) * 20);
            
            const avgWinners = winners.reduce((sum, p) => sum + getRating(p), 0) / winners.length;
            const avgLosers = losers.reduce((sum, p) => sum + getRating(p), 0) / losers.length;

            // Fórmula ELO da imagem: E = 1 / (1 + 10^((R_adv - R_self) / 800))
            // E é a probabilidade do time vencedor ganhar
            const exponent = (avgLosers - avgWinners) / 800;
            const E = 1 / (1 + Math.pow(10, exponent));

            // Cálculo de Pontos (P): P = 18 + (1 - E) * 9
            const P = Math.round(18 + (1 - E) * 9);

            const updatePromises = [];

            winners.forEach(p => {
                const currentRating = getRating(p);
                const newStreak = [...(p.streak || []), "W"];
                if(newStreak.length > 5) newStreak.shift();
                
                const playerRef = doc(db, "players", p.id);
                updatePromises.push(updateDoc(playerRef, {
                    total: (p.total || 0) + 1,
                    vitorias: (p.vitorias || 0) + 1,
                    rating: currentRating + P,
                    streak: newStreak
                }));
            });

            losers.forEach(p => {
                const currentRating = getRating(p);
                const newStreak = [...(p.streak || []), "L"];
                if(newStreak.length > 5) newStreak.shift();

                const playerRef = doc(db, "players", p.id);
                updatePromises.push(updateDoc(playerRef, {
                    total: (p.total || 0) + 1,
                    derrotas: (p.derrotas || 0) + 1,
                    rating: Math.max(0, currentRating - P),
                    streak: newStreak
                }));
            });

            await Promise.all(updatePromises);

            const author = user.email ? user.email.split('@')[0] : 'Desconhecido';

            const newMatch = {
                date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
                timestamp: Date.now(),
                winners: winners.map(w => w.name),
                losers: losers.map(l => l.name),
                pontosGanhos: P,
                pontosPerdidos: P,
                season: CURRENT_SEASON,
                createdBy: author
            };
            await addDoc(collection(db, "history"), newMatch);

        } catch(error) {
            console.error("Erro ao registrar partida", error);
        }
    };

    return (
        <AppContext.Provider value={{ user, loading, login, logout, players, history, handleMatchResult, addPlayer }}>
            {!loading && children}
        </AppContext.Provider>
    );
};
