import React from "react";
import ReactDOM from "react-dom";
import {
  Appear,
  Box,
  CodePane,
  Deck,
  FlexBox,
  FullScreen,
  Heading,
  ListItem,
  Progress,
  Slide,
  Stepper,
  Notes,
  Text,
  UnorderedList,
  indentNormalizer,
} from "spectacle";
import "./index.css";

// SPECTACLE_CLI_THEME_START
const theme = {
  fonts: {
    header: '"Open Sans Condensed", Helvetica, Arial, sans-serif',
    text: '"Open Sans Condensed", Helvetica, Arial, sans-serif',
  },
};
// SPECTACLE_CLI_THEME_END

// SPECTACLE_CLI_TEMPLATE_START
const template = () => (
  <FlexBox
    justifyContent="space-between"
    position="absolute"
    bottom={0}
    width={1}
  >
    <Box padding="0 1em">
      <FullScreen />
    </Box>
    <Box padding="1em">
      <Progress />
    </Box>
  </FlexBox>
);
// SPECTACLE_CLI_TEMPLATE_END

const cppCodeBlock = indentNormalizer(`
import React from "react";
import Grid from "@material-ui/core/Grid";
import "./index.css";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardMedia from "@material-ui/core/CardMedia";
import Card from "@material-ui/core/Card";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";

class MemeGallery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      memeCollection: [],
      currentSelectedImg: 0,
      dialogIsOpen: false,
      currentSelectedbase64: null,
      topText: "",
      bottomText: "",
      isDraggingTop: false,
      isDraggingBot: false,
      topY: "10%",
      topX: "50%",
      bottomX: "50%",
      bottomY: "90%",
    };

    this.handleTextChange = this.handleTextChange.bind(this);
    this.exportSVGAsPNG = this.exportSVGAsPNG.bind(this);
  }

  /**
   * Lifecycle function, permet d'éxécuter du code dès que le composant est monté
   */
  componentDidMount() {
    fetch("https://api.imgflip.com/get_memes")
      .then((response) => response.json())
      .then((response) => {
        this.setState({ memeCollection: response.data.memes });
      });
  }

  /**
   * Notre svg a besoin d'un href en dataURI pour pouvoir etre converti en PNG par la suite,
   * on récupère donc notre image qu'on transforme en dataURL (base64) via l'API FileReader()
   * NB: convertion possible via canvas mais FileReader offre moins de pertes
   */
  openImageAsDataURL(index) {
    const { memeCollection, dialogIsOpen } = this.state;
    fetch(memeCollection[index].url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .then((dataURL) => {
        this.setState({
          currentSelectedImg: index,
          dialogIsOpen: !dialogIsOpen,
          currentSelectedImgbase64: dataURL,
        });
      });
  }

  /**
   * self-explanatory: permet de fermer ou d'ouvrir notre fenetre de dialogue
   */
  toggleDialog() {
    this.setState((prevState) => ({
      topText: "",
      bottomText: "",
      dialogIsOpen: !prevState.dialogIsOpen,
    }));
  }

  /**
   * fonction essentielle pour prendre en compte ce que l'user tape dans le champ texte
   * et lui en afficher le retour
   */
  handleTextChange(event) {
    this.setState({
      [event.currentTarget.name]: event.currentTarget.value,
    });
  }

  /**
   * permet de connaitre la position de la boite de texte par rapport à l'image en dessous
   */
  getStateObj(e, type) {
    let rect = this.imageRef.getBoundingClientRect();
    const xOffset = e.clientX - rect.left;
    const yOffset = e.clientY - rect.top;
    return type === "bottom"
      ? {
          isDraggingBot: true,
          isDraggingTop: false,
          bottomX: xOffset + 'px',
          bottomY: yOffset + 'px',
        }
      : {
          isDraggingTop: true,
          isDraggingBot: false,
          topX: xOffset + 'px',
          topY: yOffset + 'px',
        };
  }

  /**
   * sur le clic de la souris, on attache un eventListener à notre page pour tracker la souris
   * au déclenchement de cet event on exécute handleMouseDrag()
   */
  handleMouseDown(e, type) {
    const stateObj = this.getStateObj(e, type);
    document.addEventListener("mousemove", (event) =>
      this.handleMouseDrag(event, type)
    );
    this.setState({
      ...stateObj,
    });
  }

  /**
   * permet de récupérer les nouvelles coordonnées de la boite de texte et de les définir dans le state
   */
  handleMouseDrag(e, type) {
    const { isDraggingTop, isDraggingBot } = this.state;
    if (isDraggingTop || isDraggingBot) {
      let stateObj = {};
      if (type === "bottom" && isDraggingBot) {
        stateObj = this.getStateObj(e, type);
      } else if (type === "top" && isDraggingTop) {
        stateObj = this.getStateObj(e, type);
      }
      this.setState({
        ...stateObj,
      });
    }
  }

  /**
   * une fois le clic laché on détache l'eventListener du DOM
   */
  handleMouseUp() {
    document.removeEventListener("mousemove", this.handleMouseDrag);
    this.setState({
      isDraggingTop: false,
      isDraggingBot: false,
    });
  }

  /**
   * grosso modo ici :
   * - on récupre le node de notre svg via sa réf puis on le sérialize
   * - on créé une image à partir de notre string svg
   * - on dessine cette image dans un canvas
   * - canvas que l'on exporte en dataURL
   * - dataURL que l'on attache à un lien créé en caché dans le DOM pui autocliqué pour trigger le DL
   */
  exportSVGAsPNG() {
    const svg = this.svgRef;
    let svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      const canvasdata = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = "meme.png";
      a.href = canvasdata;
      document.body.appendChild(a);
      a.click();
    };
  }

  render() {
    const {
      memeCollection, dialogIsOpen, currentSelectedImg, currentSelectedImgbase64, topX, topY, isDraggingTop, topText, bottomX, bottomY, bottomText,
    } = this.state;
    let newWidth = 600;
    let newHeight;
    if (memeCollection.length) {
      let image = memeCollection[currentSelectedImg];
      let ratio = image.width / image.height;
      newHeight = newWidth / ratio;
    }
    const textStyle = {
      fontFamily: "Impact",
      fontSize: "50px",
      textTransform: "uppercase",
      fill: "#FFF",
      stroke: "#000",
      userSelect: "none",
    };
    return (
      <>
        {memeCollection.length ? (
          <>
            <Grid container spacing={10} style={{ padding: "24px" }}>
              {memeCollection.map((memeTile, index) => (
                <Grid
                  key={memeTile.id}
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={4}
                  xl={3}
                >
                  <Card
                    className="card"
                    onClick={() => this.openImageAsDataURL(index)}
                  >
                    <CardActionArea className="item">
                      <CardMedia className="media" image={memeTile.url} />
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Dialog
              maxWidth={newWidth}
              open={dialogIsOpen}
              aria-labelledby="meme-edit-dialog"
              onClose={() => this.toggleDialog()}
            >
              <DialogTitle>Créez votre propre meme !</DialogTitle>
              <DialogContent dividers>
                <svg
                  width={newWidth}
                  id="svg_ref"
                  height={newHeight}
                  ref={(el) => {
                    this.svgRef = el;
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                  <image
                    ref={(el) => {
                      this.imageRef = el;
                    }}
                    href={currentSelectedImgbase64}
                    height={newHeight}
                    width={newWidth}
                  />
                  <text
                    style={{
                      ...textStyle,
                      zIndex: isDraggingTop ? 4 : 1,
                    }}
                    x={topX}
                    y={topY}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    onMouseDown={(event) => this.handleMouseDown(event, "top")}
                    onMouseUp={(event) => this.handleMouseUp(event, "top")}
                  >
                    {topText}
                  </text>
                  <text
                    style={textStyle}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    x={bottomX}
                    y={bottomY}
                    onMouseDown={(event) =>
                      this.handleMouseDown(event, "bottom")
                    }
                    onMouseUp={(event) => this.handleMouseUp(event, "bottom")}
                  >
                    {bottomText}
                  </text>
                </svg>
              </DialogContent>
              <DialogActions>
                <TextField
                  autoFocus
                  margin="dense"
                  id="topText"
                  name="topText"
                  label="Top Text"
                  type="text"
                  fullWidth
                  onChange={this.handleTextChange}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="bottomText"
                  name="bottomText"
                  label="Bottom Text"
                  type="text"
                  fullWidth
                  onChange={this.handleTextChange}
                />
                <Button
                  autoFocus
                  onClick={() => this.exportSVGAsPNG()}
                  color="primary"
                >
                  Télécharger ce meme
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          "Loading memes, please stand by..."
        )}
      </>
    );
  }
}

export default MemeGallery;





















class App extends Component {
  render() {
    return <MemeGallery />;
  }
}







}`);

const Presentation = () => (
  <Deck template={template} transitionEffect="fade">
    <Slide>
      <FlexBox height="100%" flexDirection="column">
        <Heading margin="0px">
          <svg
            height={350}
            id="svg_ref"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <image href="/logo512.png" width={300} />
          </svg>
        </Heading>
        <Heading margin="0px" fontSize="100px">
          ⚛️ <i>TechDojo React</i> ⚛️
        </Heading>
      </FlexBox>
    </Slide>
    <Slide
      backgroundColor="tertiary"
      backgroundImage="url(/react_space.jpeg)"
      backgroundOpacity={0.1}
    >
      <FlexBox height="100%" flexDirection="column">
        <Heading margin="0px" fontSize="150px">
          <i>Kézako ?</i>
        </Heading>
        <Heading margin="0px" fontSize="h2">
          Présentation des fondamentaux
        </Heading>
        <Heading margin="0px 32px" color="primary" fontSize="h3">
          Création d'un générateur de meme et Présentation via Spectacle
        </Heading>
      </FlexBox>
    </Slide>
    <Slide
      backgroundColor="tertiary"
      backgroundImage="url(/react_space.jpeg)"
      backgroundOpacity={0.1}
    >
      <Heading>Speed-Présentation</Heading>
      <UnorderedList fontSize="35px">
        <Appear elementNum={0}>
          <ListItem>
            Bibliothèque Javascript développée par Facebook depuis 2013
          </ListItem>
        </Appear>
        <Appear elementNum={1}>
          <ListItem>
            Faciliter la création d'interfaces utilisateurs interactives via des
            composants réutilisables dépendants d'un état
          </ListItem>
        </Appear>
        <Appear elementNum={2}>
          <ListItem>
            Projet open-source sous licence MIT, équipe d'une 20aine de
            personnes et plus 1k contributeurs occasionnels.
          </ListItem>
        </Appear>
        <Appear elementNum={3}>
          <ListItem>Plus de 30k packages recensés sur npm en 2019</ListItem>
        </Appear>
        <Appear elementNum={4}>
          <ListItem>
            Adopté par beaucoup de gros noms du web : Airbnb, Atlassian,
            CloudFlare, Codecademy, Dailymotion, Discord, Dropbox, Facebook
            évidemment, IMDb, Instagram, Netflix, Paypal, Tesla, Twitter,
            Walmart, Wordpress, Yahoo! et des centaines d’autres
          </ListItem>
        </Appear>
      </UnorderedList>
      <Notes>
        <p>
          Initialement débuté par Jordan Wake, ingénieur chez Facebook en 2011,
          puis rejoint par Pete Hunt, ingénieur chez Instagram, pour enfin
          sortir la première version sous licence Apache 2.0 le 29 mai 2013
        </p>
        <p>
          D'après la définition qu'en fait le site officiel, React est une
          librairie destinée à construire des interfaces utilisateur
          composables. Il encourage la création des composants UI réutilisables,
          qui présentent des données pouvant varirer dans le temps. Beaucoup de
          personnes utilisent React comme le V dans MVC. React fait abstraction
          du DOM, offrant un modèle de programmation plus simple et de
          meilleures performances. Il peut également effectuer le rendu
          directement sur le serveur à l'aide de Node ou alimenter des
          applications natives à l'aide de React Native.
        </p>
      </Notes>
    </Slide>
    <Slide
      backgroundColor="tertiary"
      backgroundImage="url(/react_space.jpeg)"
      backgroundOpacity={0.1}
    >
      <Heading>Features, Avantages et Limitations</Heading>
      <UnorderedList fontSize="27px">
        <Appear elementNum={0}>
          <ListItem>
            JSX: JSX est une extension de syntaxe Javascript utilisée pour le
            rendu. Elle n'est pas nécessaire dans React mais son utilisation est
            recommandé.
          </ListItem>
        </Appear>
        <Appear elementNum={1}>
          <ListItem>
            Composants: React n'est rien d'autre qu'une logique de composant.
            Cette logique de construction aide notamment à maintenir plus
            facilement le code sur des projects à grosse architecture
          </ListItem>
        </Appear>
        <Appear elementNum={2}>
          <ListItem>
            + => Utilise un DOM virtuel qui est un object Javacscript, plus
            rapide que le DOM classique, ce qui permet à React d'offrir des
            bonnes performances.
          </ListItem>
        </Appear>
        <Appear elementNum={3}>
          <ListItem>
            + => Peut être utilisé côté client ou côté serveur, et également en
            combinaisons avec d'autres framework
          </ListItem>
        </Appear>
        <Appear elementNum={4}>
          <ListItem>
            - => Ne couvre que la couche "vue" de l'appli, on a donc quand même
            besoin de choisir et d'utiliser d'autres technologies pour avoir un
            panel d'outils de développement complet (routing absent par exemple)
          </ListItem>
        </Appear>
        <Appear elementNum={5}>
          <ListItem>
            - => L'utilisation de templating inline et du JSX peut être
            déroutante au début
          </ListItem>
        </Appear>
      </UnorderedList>
    </Slide>
    <Slide>
      <Heading>Exploration des fondamentaux</Heading>
      <Stepper
        defaultValue={[]}
        values={[
          [242, 260],
          [210, 210],
          [189, 207],
          [228, 228],
          [14, 16],
          [329, 329],
          [351, 355],
          [1, 12],
          [212, 226],
          [235, 240],
          [15, 16],
          [213, 213],
          [17.3],
          [53, 53],
          [66, 70],
          [39, 45],
        ]}
      >
        {(value, step) => (
          <Box position="relative">
            <CodePane
              highlightStart={value[0]}
              highlightEnd={value[1]}
              fontSize={18}
              language="javascript"
              autoFillHeight={true}
            >
              {cppCodeBlock}
            </CodePane>

            <Box
              position="absolute"
              bottom="0rem"
              left="0rem"
              right="0rem"
              bg="black"
            >
              {step === 0 && (
                <Text fontSize="1.5rem" margin="0rem">
                  JSX nous permet grosso modo d'écrire du HTML dans du JS
                </Text>
              )}
              {step === 1 && (
                <Text fontSize="1.5rem" margin="0rem">
                  En tant qu'expression, le JSX peut etre assigné à une
                  variable, ou comme ici, être affiché selon une condition
                </Text>
              )}
              {step === 2 && (
                <Text fontSize="1.5rem" margin="0rem">
                  Avec JSX, on peut définir des variables...
                </Text>
              )}
              {step === 3 && (
                <Text fontSize="1.5rem" margin="0rem">
                  ... et les intégrer dans nos expressions
                </Text>
              )}

              {step === 4 && (
                <Text fontSize="1.5rem" margin="0rem">
                  Dans cet exemple, nous déclarons un nouveau composant de
                  classe
                </Text>
              )}
              {step === 5 && (
                <Text fontSize="1.5rem" margin="0rem">
                  que l'on exporte en tant que module
                </Text>
              )}
              {step === 6 && (
                <Text fontSize="1.5rem" margin="0rem">
                  pour pouvoir l'importer et l'utiliser dans notre application
                </Text>
              )}
              {step === 7 && (
                <Text fontSize="1.5rem" margin="0rem">
                  de la même façon, j'importe des composants de librairies
                  externes pour composer mon interface plus rapidement...
                </Text>
              )}
              {step === 8 && (
                <Text fontSize="1.5rem" margin="0rem">
                  ... en les intégrant dans mes expressions JSX avec les
                  propriétés dont ils ont besoin, c'est la logique de composant
                  !
                </Text>
              )}
              {step === 9 && (
                <Text fontSize="1.5rem" margin="0rem">
                  on passe les propriétés a un compo via des attributs custom
                  dans le tag JSX du compo enfant
                </Text>
              )}
              {step === 10 && (
                <Text fontSize="1.5rem" margin="0rem">
                  qu'il récupérera dans son constructeur, comme tous les
                  composants
                </Text>
              )}
              {step === 11 && (
                <Text fontSize="1.5rem" margin="0rem">
                  Au delà de l'utilisation de la fonction .map() JS classique,
                  dans React, cette dernière permet également d'interpoler les
                  éléments d'une liste en variable que l'on passe en props à un
                  pattern que l'on souhaite répéter
                </Text>
              )}

              {step === 12 && (
                <Text fontSize="1.5rem" margin="0rem">
                  le "state" d'un composant est l'objet dans lequel nous allons
                  stocker toutes nos données liées directement à notre interface
                </Text>
              )}
              {step === 13 && (
                <Text fontSize="1.5rem" margin="0rem">
                  On peut maintenant accéder à ces valeurs dans tout notre
                  composant...
                </Text>
              )}
              {step === 14 && (
                <Text fontSize="1.5rem" margin="0rem">
                  la méthode setState nous permet de mettre à jour les data du
                  state
                </Text>
              )}

              {step === 15 && (
                <Text fontSize="1.5rem" margin="0rem">
                  componentDidMount() est une méthode du cycle de vie d'un
                  composant React
                </Text>
              )}
            </Box>
          </Box>
        )}
      </Stepper>
      <Notes>
        <h3>JSX</h3>
        <p>
          JSX permet en gros d'écrire du HTML dans notre javascript. Le JSX peut
          utiliser tous les tags valides HTML
        </p>
        <p>
          En tant qu'expression, le JSX peut etre assigné à des variables ou
          affiché de façon conditionnelle voire même retourné par une fonction
        </p>
        <p>
          Les curly braces nous permette d'insérer des valeurs javascript
          primitives (pas des objets directement) directement dans nos
          expressions
        </p>
        <br />
        <h3>Composant et props</h3>
        <p>
          Il existe deux types de composants, les composants "fonctions" et les
          composants "classe", pour ce techDojo nous ne verrons que les compo
          classe, que nous utilisons dans Sélénée, mais si certains sont
          intéressés, les composants "fonctions" pourront être un autre sujet de
          techDojo
        </p>
        <br />
        <h3>L'utilisation du State dans React</h3>
        <p>
          State est l'endroit où l'on va stocker toutes les données de notre
          composant. Il est important de concevoir des state les plus simples
          possibles et surtout minimiser le nombre de composants "stateful". Si
          par exemple nous avions 10 compo qui nécessitent des données du state,
          il est alors préférable de créer un compo "container" qui va permettre
          de gérer les state pour les compo enfants.
        </p>
        <p>
          La principale différence entre state et props est que props est
          "immutable". C'est pourquoi dans notre exemple précédent, le compo
          container devrait définir le state qui peut être modifié et mis à
          jour, et les compo enfants ne recoivent cette data du state que via
          props.
        </p>
        <p>
          La méthode setState() est utilisée pour mettre à jour l'objet state
          d'un composant. Cette méthode ne remplace pas le state, elle se
          contente simplment d'appliquer des changements à l'objet original
        </p>
        <br />
        <h3>Les "life-cycle methods"</h3>
        <p>
          Afin d'optimiser les performances générales de notre composant, nous
          pouvons déclarer des méthodes spéciales pour éxécuter du code
          uniquement à certaines étapes de la vie d'un composant, notamment au
          montage ou au démontage, comme avec ComponentDidMount() ou
          ComponentWillUnmount().
        </p>
        <ul>
          <li>
            La première méthode, que l'on voit en exemple, est éxécutée juste
            après le premier rendu côté client. C'est à partir d'ici que vont se
            faire les requetes AJAX ou les fetch d'API, et que les updates du
            DOM ou du state devraient se faire.
          </li>
          <li>
            componentWillUnmount() quand à elle est appelée juste après que
            notre composant a été démonté du DOM, permet notamment d'effectuer
            toutes les opérations de "nettoyage"
          </li>
          <li>
            Il existe plusieurs autres méthodes, il y en a 7 au total, chacune
            intervenant à un moment différent de la vie d'un compo
          </li>
        </ul>
      </Notes>
    </Slide>
    <Slide
      backgroundColor="tertiary"
      backgroundImage="url(/react_space.jpeg)"
      backgroundOpacity={0.1}
    >
      <FlexBox height="100%" flexDirection="column">
        <Heading margin="0px" fontSize="150px">
          <i>Des questions ?</i>
        </Heading>
        <Heading margin="0px" fontSize="h2">
          Merci de m'avoir suivi
        </Heading>
        <Heading margin="0px 32px" color="primary" fontSize="h3">
          Passons à la démo de l'appli
        </Heading>
      </FlexBox>
    </Slide>
  </Deck>
);

ReactDOM.render(<Presentation />, document.getElementById("root"));
