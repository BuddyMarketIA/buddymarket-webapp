import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const FOUNDER_EMAILS = [
  "nosoypeque@hotmail.com","pablobravo44@gmail.com","pedrojesusjimenezmartinez@gmail.com",
  "javierveza@gmail.com","juliadife2000@gmail.com","Rojasjimenez.rojasjimenez@gmail.com",
  "pilar9905@gmail.com","j.pabloscarmona@hotmail.com","sugarbalance11@gmail.com",
  "floracare11@gmail.com","siboreset11@gmail.com","buddymoments11@gmail.com",
  "rogerem99@gmail.com","khim.2601@gmail.com","beatrizbeldagonzalez@gmail.com",
  "aranchargr@icloud.com","luisamariaccc@msn.com","krayt75@gmail.com",
  "miriamperez@gmail.com","lucia26cc@hotmail.com","miguelarios46@hotmail.com",
  "ruspoluis@gmail.com","tecnisellermx@gmail.com","jaimecaronunezrobres@gmail.com",
  "aperezchinarro@gmail.com","marcussaxby@gmail.com","maria_mg92@hotmail.com",
  "amayaenriquez@hotmail.com","rabell.aina@gmail.com","estrada@infodenuncias.com",
  "carla.benitezdelugo@gmail.com","cris.cartolari@gmail.com","paulaeiriz04@gmail.com",
  "luciamillanp@gmail.com","luiscarro93@icloud.com","gadeasancho99@gmail.com",
  "nutridiabetico11@gmail.com","buddycoach11@gmail.com","nutricionholistica11@gmail.com",
  "midietaperfecta11@gmail.com","buddykids11@gmail.com","rsa02@icloud.com",
  "buddybalance11@gmail.com","fec15@euht-santpol.org","garcia.cosin@gmail.com",
  "Aguacatte@gmail.com","macinalcober@gmail.com","hugoaaa@hotmail.com",
  "vickymr.594@gmail.com","alfonsoandcompa@gmail.com","carbonellescobarpaula@gmail.com",
  "rezola.alvaro@gmail.com","nuria@delvy.es","agustin_pozuelo@yahoo.es",
  "martinro510es@gmail.com","vanesasoaresloureiro@gmail.com","carlotagarciiam@gmail.com",
  "pino@escudero.eu","c.aramendiadesalas@gmail.com","grf.guillermo@gmail.com",
  "tdelcastilloe@gmail.com","torrecastillo2304@gmail.com","cbonmir@yahoo.es",
  "js.morato@gmail.com","alfonsordec@me.com","ro95velez@hotmail.com",
  "fperezsoria@gmail.com","claramendezdevigo@hotmail.com","juanescudero.gc@gmail.com",
  "lucialosada@francastudio.com","leopoldorjqll@gmail.com","nightpijamas@gmail.com",
  "idecotta@ucm.es","gnavmun@gmail.com","aescalada@sandiego.edu",
  "scb@invercasti.com","luciaruizl@hotmail.com","jriestra@outlook.es",
  "juanmbq@outlook.com","inavarro1994@gmail.com","ircardenascc@hotmail.com",
  "lopezdelaosa_pilar@hotmail.com","gcabellodeloscobos@gmail.com","alsantana@santanajerez.com",
  "albertosantanamolina@gmail.com","gcabellodeloscobos@hotmail.com","pam.manzanilla@gmail.com",
  "alvarofc.trabajo@gmail.com","tatiana.aleon@gmail.com","rlacalle.ga@gmail.com",
  "alvaro.segovia.fshaw@gmail.com","blancamayoralarino@gmail.com","pvlazaga@gmail.com",
  "carlosmontoliud@gmail.com","raulggarc@gmail.com","esterlasmabe@hotmail.com",
  "llopisanna@hotmail.com","mrovirasap@gmail.com","jesustomastoledo@gmail.com",
  "recasensluis@gmail.com","luisy_maldo@hotmail.com","carlizarriturri@gmail.com",
  "eduardogildesantivanes@gmail.com","myriam.sainz.valdes@gmail.com","carlasolermartell@gmail.com",
  "alvaro.nabal.gomez@gmail.com","monicaperezferrandiz@gmail.com","notario@cavellodeloscobos.com",
  "yacobimaria@gmail.com","arribasbrains@hotmail.es","aolavide1@gmail.com",
  "alexruizdevilla@gmail.com","blancahcc_97@hotmail.com","pmapo@hotmail.com",
  "nachomesas@gmail.com","lbolas@yahoo.es","alvarofontaneda@outlook.com",
  "carmen.noain@gmail.com","cristina.carralero@yahoo.es","antoniordec@me.com",
  "magdalenacdelosc@gmail.com","mcdelcastillo@me.com","maddalen.agirre@gmail.com",
  "luismariaccc@gmail.com"
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let inserted = 0;
let skipped = 0;

for (const email of FOUNDER_EMAILS) {
  const normalized = email.toLowerCase().trim();
  try {
    await client.query(
      `INSERT INTO founder_emails (email, "addedBy", "addedAt") 
       VALUES ($1, 'import', NOW()) 
       ON CONFLICT (email) DO NOTHING`,
      [normalized]
    );
    inserted++;
  } catch (err) {
    console.error(`Error inserting ${normalized}:`, err.message);
    skipped++;
  }
}

const { rows } = await client.query('SELECT COUNT(*) FROM founder_emails');
console.log(`✅ Inserted: ${inserted}, Skipped: ${skipped}, Total in DB: ${rows[0].count}`);
await client.end();
