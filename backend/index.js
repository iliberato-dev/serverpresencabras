import dotenv from 'dotenv';
dotenv.config();  // carrega o .env
const app = express();
const PORT    = process.env.PORT || 3000;
const FRONT   = process.env.FRONT_URL;  // ex: https://presencas-bras.vercel.app
const GAS_URL = process.env.GAS_URL;

// 1) CORS: permita apenas seu front e trate preflight
const corsOptions = {
  origin: FRONT,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));
// Garante resposta a OPTIONS em todas as rotas
app.options('*', cors(corsOptions));

// 2) json parser e log
app.use(express.json());
app.use(morgan('tiny'));

// 3) suas rotas
app.get('/', (req, res) => res.send('API no ar!'));

app.post('/presenca', async (req, res) => {
  try {
    const resp = await fetch(GAS_URL, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await resp.text();
    return res.status(200).send(text);
  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// outros GETs que você tenha...

app.listen(PORT, () =>
  console.log(`API ouvindo em http://localhost:${PORT}`)
);
