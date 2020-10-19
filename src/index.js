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
    </Slide>
    <Slide>
      <Heading>Exploration des fondamentaux</Heading>
      <Stepper
        defaultValue={[]}
        values={[
          [1, 12],
          [14, 16],
          [17, 30],
          [36, 45],
          [52, 72],
          [74, 83],
          [85, 93],
          [95, 115],
          [117, 129],
          [131, 147],
          [149, 158],
          [168, 187],
          [189, 208],
          [208, 228],
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
              {/*{step === 1 && (
                <Text fontSize="1.5rem" margin="0rem">
                  This is a note!
                </Text>
              )}

              {step === 2 && (
                <Text fontSize="1.5rem" margin="0rem">
                  You can use the stepper state to render whatever you like as
                  you step through the code.
                </Text>
              )}*/}
            </Box>
          </Box>
        )}
      </Stepper>
    </Slide>
  </Deck>
);

ReactDOM.render(<Presentation />, document.getElementById("root"));
