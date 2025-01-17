import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { addBike, addBikeDriver, addMapa } from '../models/bikeModules.js';  
import db from '../database/database.js'; 
const router = express.Router();
const app = express();  

const __dirname = path.dirname(new URL(import.meta.url).pathname);

app.use(session({
    secret: 'seu_segredo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use(express.urlencoded({ extended: true }));



router.post('/addBikeDriver', async  (req, res) => {   
    let {usuario, email, numero, matricula, eAlugador, bikeCount, chavePix, senha } = req.body;      
    
    if (!usuario) {
        return res.status(400).json({error: 'O campo usuario é obrigatório', status:'usuario'});
    }
    if (!email) {
        return res.status(400).json({error: 'O campo email é obrigatório', status:'email'});
    }
    if (!numero) {
        return res.status(400).json({error: 'O campo numero é obrigatório', status:'numero'});
    }
    if (!matricula) {
        return res.status(400).json({error: 'O campo matricula é obrigatório', status:'matricula'});
    }
    if (eAlugador == 'true' && bikeCount == 0) {
        return res.status(400).json({error: 'Informe a quantidade de Bicicleta que quer cadastrar', status:'bikeCount'});
    }
    if (eAlugador == 'true' && !(chavePix)) {
        return res.status(400).json({error: 'O campo chave Pix é obrigatório para o alugador', status:'chavePix'});
    }
    if (!senha) {
        return res.status(400).json({error: 'O campo senha é obrigatório', status:'senha'});
    }   
    
    try {             

        const hashedSenha = await bcrypt.hash(senha,10)           

        const bikeDriver = { usuario, email, numero, matricula, eAlugador, bikeCount, chavePix, senha: hashedSenha };

        if (eAlugador != 'false') {        
            db.get("SELECT COUNT(*) AS bikeCount FROM Bike", (err, row) => {
                if (err) {
                    return res.status(500).json({error: 'Erro ao verificar quantidade de bicicletas'});
                }
                const bikeCountBanco = row.bikeCount;
                const bikeLimit = 10;  

                if (Number(bikeCount) + bikeCountBanco >= bikeLimit) {
                    return res.status(400).json({error: 'Limite de Bicicletas atingido', status: 'bikeLimit'});
                }

                        addBikeDriver(bikeDriver , (err, id) => {    
                    if (err) {
                        return res.status(500).json({error: 'Erro ao adicionar BikeDriver'});
                    }
                
                    if (eAlugador === "true" && bikeCount > 0) {
                        for (let i = 0; i < bikeCount; i++) {
                            const bike = {
                                idBikeDriver: id,
                                dataAluguel: '',
                                alugada: false
                            };
                            addBike(bike, (err, bikeId) => {
                                if (err) {
                                    return res.status(500).json({error: 'Erro ao adicionar as bicicletas'});
                                }
                            });
                        }
                    }                 
                    
                    return res.status(201).json({message: 'BikeDriver criado com sucesso'});
                });
            });
        } else {            
                addBikeDriver(bikeDriver , (err, id) => {    
                if (err) {
                    return res.status(500).json({error: 'Erro ao adicionar BikeDriver'});
                }
                return res.status(201).json({message: 'BikeDriver criado com sucesso'});
            });
        }
    } catch (err) {
        return res.status(500).json({error: 'Erro ao adicionar BikeDriver'});
    }
});


router.post('/addBike', (req , res) => {
    const {idBikeDriver, dataAluguel, alugada} = req.body;
    if(!idBikeDriver){
        return res.status(400).json({error: 'O campo idBikeDriver é obrigatório'})
    } 

    const bike = {idBikeDriver, dataAluguel, alugada};
    addBike(bike, (err, id) => {
        if(err){
            return res.status(500).json({ error: 'Erro ao adicionar Bike'});
        }
        res.status(201).json({message: 'Bike criado com sucesso', id})
    })
})

router.post('/addMapa',(req, res) => {
    const {local, bicicletasList} = req.body;
    if(!local){
        return res.status(500).json({error:'local é obrigatório'})
    }
    
    addMapa(local, bicicletasList, (err,id) => {
        if(err){
            return res.status(500).json({error:"Error ao adicionar Mapa"})
        }
        return res.status(201).json({message: "Mapa criada com sucesso",id})
    })
} )

router.get('/ponto/:local', async (req, res) => {
    const local = req.params.local;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/');
    }

    const row = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM Mapa WHERE local = ?', [local], (err, mapa) => {
            if (err) return reject(err);
            resolve(mapa);
        });
    });
        
    let spaces = [[0,false],[0,false],[0,false],[0,false],[0,false],[0,false],[0,false],[0,false],[0,false],[0,false]];
    let promises = [];
        
        for (let i = 1; i <= 10; i++) {          
            if (row[`espaco_${i}`] > 0) { 
                const bikeId = row[`espaco_${i}`];                        
                const promise = new Promise((resolve, reject) => {
                    db.get('SELECT * FROM Bike WHERE id = ? AND idBikeDriver = ?', [bikeId, userId], (err, bike) => {
                        if (err) {
                            reject(err);
                        } 
                        if(bike){                             
                            spaces[i-1][0] = bikeId; 
                            spaces[i-1][1] = true;                                               
                        }else{
                            spaces[i-1][0] = bikeId;
                        }
                        resolve();
                    });
                });
                promises.push(promise); 
            } 
        }        
        
        Promise.all(promises)
            .then(() => {                           
                res.render('bikePonto', {
                    local: local,
                    space: spaces,
                    userId: userId
                });
            })
            .catch((err) => {
                console.error('Erro ao processar as bicicletas:', err);
                res.status(500).json({ error: 'Erro ao processar as bicicletas' });
            });
});


export default router;

/*
router.get('/ponto/:local', (req, res) => {
    const local = req.params.local;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/'); 
    }    
    class Space {
        constructor(bikeId, isUserBike = false) {
            this.bikeId = bikeId; 
            this.isUserBike = isUserBike;
        }
    }
    const query = `
    SELECT
        m.id AS mapa_id,
        COALESCE(b.id, 0) AS bike_id,
        CASE 
            WHEN b.idAlugador = ? THEN TRUE
            ELSE FALSE
        END AS is_vinculado
    FROM
        Mapa m
    LEFT JOIN
        Bike b ON m.espaco_1 = b.id OR m.espaco_2 = b.id OR m.espaco_3 = b.id 
        OR m.espaco_4 = b.id OR m.espaco_5 = b.id OR m.espaco_6 = b.id 
        OR m.espaco_7 = b.id OR m.espaco_8 = b.id OR m.espaco_9 = b.id 
        OR m.espaco_10 = b.id
    WHERE
        m.local = ?
`;    

db.all(query, [userId, local], (err, map) => {
    if (err) {
        return res.status(500).json({ error: 'Erro ao acessar os dados do mapa' });
    }    
    console.log(map)     
});


    let spaces = [];
    
    db.get('SELECT * FROM Mapa WHERE local = ?', [local], (err, row) => {
        if (err) {
            return res.status(500).json({error: 'Erro ao acessar os dados do mapa'});
        }
        if (!row) {
            return res.status(404).json({error: 'Ponto não encontrado no mapa'});
        }

        const spacePromises = [];

        for (let i = 1; i <= 10; i++) {
            const bikeId = row[`espaco_${i}`];                       
            const promise = new Promise((resolve, reject) => {
                db.get('SELECT * FROM Bike WHERE id = ? AND idBikeDriver = ?', [bikeId, userId], (err, bike) => {
                    if (err) {
                        reject(err);
                    } else {
                        const space = new Space(bikeId, bike ? true : false);
                        spaces.push(space);
                        resolve();
                    }
                });
            });
            spacePromises.push(promise);                        
        }        
        Promise.all(spacePromises)
            .then(() => {
                res.render('bikePonto', {
                    local: local,
                    space: spaces,
                    userId: userId
                });
            })
            .catch((error) => {
                return res.status(500).json({ error: 'Erro ao processar as bicicletas' });
            });
    });
});

*/