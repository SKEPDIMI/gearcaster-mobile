import React, { Component } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  ScrollView,
  TouchableHighlight
} from 'react-native';
import { connect } from 'react-redux';
import { Button, ArrowButton, Text, CustomAlert } from '../components/custom';
import socket from '../socket';
import Card, { CardBack, styles as cardStyles } from '../components/Duel/Card';
import globalStyles from '../styles';
import { capitalize } from '../helpers';
import { Audio } from 'expo-av';
import images from '../images';
import { LinearGradient } from 'expo-linear-gradient';
import Shop from '../components/DeckConfiguration/Shop';
import Dialogue from '../components/Duel/Dialogue';
import navigationService from '../navigationService';
import store from '../store';

let rolloverAudio = new Audio.Sound();
rolloverAudio.loadAsync(require('../../assets/audio/ui/rollover.mp3'));

class DeckConfiguration extends Component {
  state = {
    tutorialPhase: null,
    selectedDeck: null,
    collection: {
      spareCards: [],
      configuredDecks: {
        // valid: Boolean,
        // cards: AnyCard[]
      }
    },
    // layout stuff
    dropLayout: { pageX: undefined, pageY: undefined, width: undefined, height: undefined },
    offsetIndex: 0,
    hoveringCard: null,
    glowDropArea: new Animated.Value(0),
    showingShop: false,
    shopAnimation: new Animated.Value(0)
  }
  componentDidMount() {
    socket.on('connect', () => this.loadCollection);
    this.willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      () => {
        // this.setState({ selectedDeck: null });
        this.loadCollection();
      }
    );
  }
  componentDidUpdate(prevProps) {
    if (!prevProps.user && !!this.props.user) {
      this.loadCollection();
    }
  }
  componentWillUnmount() {
    this.willFocusSubscription.remove();
  }
  loadCollection() {
    const { user } = this.props;

    if (!user) return console.log('failed to load collection, unauthenticated');
    console.log('loading deck', Date.now());

    socket.emit('user.collection', user.username, (err, collection) => {
      if (!err && collection) {
        this.setState({ collection });

        if (user.needsToLearn.includes("deck-config") && !this.state.tutorialPhase) {
          this.initTutorial();
        }
      } else {
        console.warn(err);
      }
    });
  }

  initTutorial() {
    this.props.dispatch({
      type: 'SET_ALERT',
      payload: {
        component: (
          <Dialogue
            text="Welcome to your workshop! Here you will craft the ultimate deck."
            onPress={() => {
              this.props.dispatch({ type: 'SET_ALERT', payload: null });
              socket.emit("user.setLearnt", "deck-config");
              this.setState({ tutorialPhase: tutorialPhases['INTRO_EXPLAIN'] });
            }}
          />
        )
      }
    });
  }

  /**
   * return spare cards and all cards in all configuredDecks
   */
  get allCards() {
    const { collection } = this.state;

    // reduce the cards in each deck into a single array of cards
    const deckCards = Object.values(collection.configuredDecks).reduce((memo, deck) => ([
      ...memo,
      ...deck.cards
    ]), []);

    // combines the quantities of cards in both deckCards and spareCards
    // example:
    // There are 2 "Minion Bot"s in deckCards and 3 "Minion Bot"s in spareCards
    // cardQuantityKeys["Minion Bot"] = {...card, quantity: 5 }
    const cardQuantityKeys = ([...collection.spareCards, ...deckCards]).reduce((memo, card) => {
      if (!memo[card.id]) {
        memo[card.id] = {
          ...card,
          quantity: 0
        }
      }

      memo[card.id].quantity += card.quantity;
      return memo;
    }, {});

    return Object.values(cardQuantityKeys);
  }
  /**
   * Cards in the selected deck
   */
  get cardsInDeck() {
    const { selectedDeck, collection } = this.state;
    return collection.configuredDecks[selectedDeck].cards;
  }

  /**
   * either shows all cards or selectedDeck.cards
   * shows one slice at a time (8 cards) based on offsetIndex.
   * Also filters amount of cards in deck when there is a deck
   * Example: There are 4 "Minion Bot"s in allCards and 2 in selectedDeck. Return 2 "Minion Bot"
   */
  sampleCards(offsetIndex) {
    const { collection, selectedDeck } = this.state;
    const offsetLength = 8;
    const allCards = this.allCards;
    let array = [...allCards];

    if (selectedDeck) {// show amount left after filtering deck cards

      // object of card.id's (key) with their quantities (value)
      let quantityKeys = allCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      const deck = collection.configuredDecks[selectedDeck];
      deck.cards.forEach(card => {
        quantityKeys[card.id].quantity -= card.quantity;
      });
      array = Object.values(quantityKeys);
    }

    return array
            .slice(offsetIndex * offsetLength, offsetIndex * offsetLength + offsetLength)
            .sort((a, b) => {
              if(a.id < b.id) return -1;
              if(a.id > b.id) return 1;
              return 0;
            });
  }

  totalDeckSize(selectedDeck) {
    let size = 0;

    const deck = this.state.collection.configuredDecks[selectedDeck];

    if (!deck) return undefined;

    deck.cards.forEach((c) => {
      size += c.quantity;
    });

    return size;
  }
  deckSizeLimit(selectedDeck) {
    const deck = this.state.collection.configuredDecks[selectedDeck];

    if (!deck) return undefined;

    const size = this.totalDeckSize(selectedDeck);

    return size < 30 ? '30' : '50';
  }
  /**
   * Called by the side bar when the user selects a deck
   */
  setDeck = (selectedDeck) => {
    if (
      selectedDeck &&
      selectedDeck !== "classic"
    ) {
      Alert.alert(`${capitalize(selectedDeck)} Deck coming soon!`);
    } else {
      const { tutorialPhase } = this.state;

      rolloverAudio.playFromPositionAsync(0);
      this.setState({ selectedDeck });

      if (tutorialPhase && tutorialPhase.step === 'INTRO_DECK_CHOOSE' && selectedDeck === 'classic') {
        this.setState({
          tutorialPhase: tutorialPhases.PENDING_INTRO_DRAG
        });
      }
    }
  }

  /**
   * request to add a card to the selected deck
   * */
  addToDeck(cardID) {
    if (!this.state.selectedDeck) return;
    const deckName = this.state.selectedDeck;

    socket.emit('deck.addCard', { deckName, cardID }, (err, isValid) => {
      if (err) return Alert.alert(err);

      rolloverAudio.playFromPositionAsync(0);
      /* REMOVE FROM SPARE CARDS */
      let spareCardsObj = this.state.collection.spareCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});
      spareCardsObj[cardID].quantity = Math.max(0, spareCardsObj[cardID].quantity - 1);

      /* ADD TO DECK */
      let deck = this.state.collection.configuredDecks[deckName];

      let deckCardsObj = deck.cards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      if (!deckCardsObj[cardID]) {
        deckCardsObj[cardID] = {
          ...spareCardsObj[cardID],
          quantity: 0
        }
      }
      deckCardsObj[cardID].quantity += 1;

      /* SAVE EVERYTHING IN STATE */
      deck.cards = Object.values(deckCardsObj);
      deck.valid = isValid;

      this.state.collection.spareCards = Object.values(spareCardsObj);

      this.setState(this.state);

      const { tutorialPhase } = this.state;
      if (tutorialPhase && tutorialPhase.step === 'INTRO_DRAG') {
        this.setState({ tutorialPhase: tutorialPhases.INTRO_REMOVE });
      }
    })
  }

  /**
   * request to remove a card from the currently selected deck
   */
  removeFromDeck(cardID) {
    const deckName = this.state.selectedDeck;
    if (!deckName) return;

    socket.emit('deck.removeCard', { deckName, cardID }, (err, isValid) => {
      if (err) return Alert.alert(err);

      rolloverAudio.playFromPositionAsync(0);

      /* REMOVE FROM DECK */
      let deck = this.state.collection.configuredDecks[deckName];

      let deckCardsObj = deck.cards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      deckCardsObj[cardID].quantity -= 1;

      /* ADD TO SPARE CARDS */
      let spareCardsObj = this.state.collection.spareCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      if (!spareCardsObj[cardID]) {
        spareCardsObj[cardID] = {
          ...deckCardsObj[cardID],
          quantity: 0
        }
      }
      spareCardsObj[cardID].quantity += 1;

      if (!deckCardsObj[cardID].quantity) {
        delete deckCardsObj[cardID]
      }

      /* SAVE EVERYTHING IN STATE */
      deck.cards = Object.values(deckCardsObj);
      deck.valid = isValid;

      this.state.collection.spareCards = Object.values(spareCardsObj);

      this.setState(this.state);
    });
  }

  toggleShop() {
    Animated.timing(this.state.shopAnimation, {
      toValue: this.state.showingShop ? 0 : 1,
      fromValue: !this.state.showingShop ? 0 : 1,
      duration: 1000,
      useNativeDriver: true
    }).start();

    
    new Audio.Sound().loadAsync(require('../../assets/audio/ui/drawer.mp3'), { shouldPlay: true });
    
    if (!this.state.showingShop) {
      new Audio.Sound().loadAsync(require('../../assets/audio/ui/enter-store.mp3'), { shouldPlay: true });
    }

    this.setState({ showingShop: !this.state.showingShop });
  }
  
  render() {
    const { allCards } = this;
    const { offsetIndex, selectedDeck, collection, tutorialPhase } = this.state;
    const sampleCards = this.sampleCards(offsetIndex);

    const { user } = this.props;

    if (!user) return <View/>;

    return (
      <View style={{ flex: 1, backgroundColor: '#776969' }}>
        {/* TUTORIAL DIALOGUE */}
        {
          tutorialPhase && tutorialPhase.dialogue 
          ? (
            <Dialogue
              small
              text={tutorialPhase.dialogue.text}
              style={{
                position: 'absolute',
                marginHorizontal: 30,
                left: 0,
                right: 0,
                ...(tutorialPhase.dialogue.align === 'top' ? {
                  top: 10,
                } : {}),
                ...(tutorialPhase.dialogue.align === 'bottom' ? {
                  bottom: 10,
                } : {}),
                zIndex: 60 // above everything else
              }}
              onPress={
                tutorialPhase.hasOwnProperty('nextStep')
                ? () => {
                    this.setState({ tutorialPhase: tutorialPhases[tutorialPhase.nextStep] })
                  }
                : undefined
              }
            />
          )
          : null
        }

        <Animated.View
          style={{
            ...globalStyles.absoluteCenter,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: this.state.shopAnimation,
            left: this.state.shopAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [5000, 0]
            }),
            zIndex: 10,
            paddingVertical: 6,
            paddingHorizontal: 42
          }}
        >
          <Shop
            onClose={() => this.toggleShop()}
          />
        </Animated.View>
        <View style={styles.deckConfigurationView}>
          {/* HEADER */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={require('../../assets/img/ui/backgrounds/tatami-header.png')}
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingBottom: 8
              }}
              resizeMode="cover"
            >
              <View
                style={{
                  flexDirection: 'row',
                  flex: 1,
                  maxWidth: 710,
                  marginHorizontal: 6,
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Button
                  title="Home"
                  stoneContainer
                  urgent
                  containerStyle={{
                    flex: 1
                  }}
                  tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}
                  onPress={() => this.props.navigation.navigate('Landing')}
                />
                <Button
                  title="Shop"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15
                  }}
                  tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}
                  onPress={() => {
                    Alert.alert("Shop is under construction!");
                    // this.toggleShop()
                  }}
                />
                <Button
                  title="Open Packs"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15,
                    position: 'relative',
                    overflow: 'visible'
                  }}
                  tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}
                  onPress={() => this.props.navigation.navigate('OpenPacks')}
                >
                  {
                    Object.values(this.props.user.unopenedPacks).length
                    ? <View
                        style={{
                          backgroundColor: '#FF3336',
                          borderColor: '#DBC25E',
                          borderWidth: 1,
                          borderRadius: 1,
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          position: 'absolute',
                          bottom: -9,
                          right: -14
                        }}
                      >
                        <Text bold style={{ fontSize: 12 }}>{Object.values(this.props.user.unopenedPacks).length}</Text>
                      </View>
                    : null
                  }
                </Button>
                <Button
                  title={
                    user.adventureSession
                      ? (user.adventureSession.gameID ? "Resume Duel" : "Resume")
                      : selectedDeck ? "Play" : "Select a Deck"}
                  stoneContainer
                  containerStyle={{
                    flex: 2
                  }}
                  disabled={!user.adventureSession && (!selectedDeck || !user.configuredDecks[selectedDeck].valid)}
                  charged={(!user.adventureSession && selectedDeck) || (user.adventureSession)}

                  onPress={() => {
                    if (user.adventureSession) {
                      if (user.adventureSession.gameID) {
                        const adventureSession = this.props.user.adventureSession;

                        socket.emit('adventure.startDuel', (err, gameID) => {
                          if (err) Alert.alert(err);
                          else {
                            this.props.navigation.navigate('Duel', {
                              gameID,
                              selectedDeck: adventureSession.deckName
                            });
                          }
                        });
                      } else {
                        this.props.navigation.navigate('AdventureMode');
                      }
                    } else if (selectedDeck && user.configuredDecks[selectedDeck].valid) {
                      this.props.dispatch({
                        type: 'SET_ALERT',
                        payload: { component: <GamemodeModal selectedDeck={selectedDeck}/> }
                      });
                    }
                  }}
                />
              </View>
            </ImageBackground>
          </View>

          {/* BOARD CONTAINER */}
          <View style={styles.boardContainer}>
            {/* MAIN CONTAINER BOARD */}
            <View style={styles.mainBoardContainer}>
              {/* PAGE INDICATOR */}
              {
                allCards
                ? (
                  <View
                    style={{
                      ...globalStyles.cobbleBox,
                      position: 'absolute',
                      top: -18,
                      left: 14
                    }}
                  >
                    <Text bold>Page {offsetIndex + 1}/{Math.ceil(allCards.length / 8)}</Text>
                  </View>
                )
                : null
              }
              {/* LEFT PAGE BUTTON */}
              {this.state.offsetIndex > 0
                ? <View style={{...styles.nextPageButtonContainer, left: -22}}>
                    <ArrowButton
                      direction='left'
                      style={{
                        height: 54,
                        width: 108,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex - 1 });
                      }}
                    />
                  </View>
                : null
              }

              {/* MAIN BOARD */}
              <ImageBackground
                style={styles.mainBoard}
                source={require('../../assets/img/ui/backgrounds/deckconfig-bg.png')}
                resizeMode="stretch"
              >
                <View style={styles.boardList}>
                  {
                    sampleCards.map((c) => {
                      return (
                        <View
                          style={{
                            marginHorizontal: 5,
                            zIndex: this.state.hoveringCard === c.instanceID ? 1000 : null
                          }}
                          key={c.instanceID}
                        >
                          <Card
                            card={c}
                            location={selectedDeck ? 'deck-configuration' : 'collection'}
                            fadeInAnim={false}
                            user={{
                              resources: {
                                health: 10000,
                                gears: 10000
                              }
                            }}
                            imageStyle={{
                              opacity: c.quantity === 0 ? 0.6 : 1
                            }}

                            tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}
                            onPressIn={() => this.setState({ hoveringCard: c.instanceID })}
                            onPressOut={() => this.setState({ hoveringCard: null })}

                            // drop are stuff
                            dropArea={this.state.dropLayout}
                            onPickUp={() => {
                              Animated.timing(this.state.glowDropArea, {
                                toValue: 1,
                                duration: 700,
                                // useNativeDriver: true, not supported
                              }).start();
                            }}
                            onDrop={(inArea) => {
                              Animated.timing(this.state.glowDropArea, {
                                toValue: 0,
                                duration: 700,
                                // useNativeDriver: true, not supported
                              }).start();
                              if (inArea && selectedDeck && c.quantity > 0) {
                                this.addToDeck(c.id);
                              }
                            }}
                          />
                          <View style={styles.quantityLabel}>
                            <Text bold style={{ fontSize: 12 }}>x{c.quantity}</Text>
                          </View>
                        </View>
                      )
                    }
                    )
                  }
                </View>
              </ImageBackground>

              {/* RIGHT PAGE BUTTON */}
              {this.sampleCards(this.state.offsetIndex + 1).length > 0
                ? <View style={{...styles.nextPageButtonContainer, right: -22}}>
                    <ArrowButton
                      direction='right'
                      style={{
                        height: 54,
                        width: 108,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex + 1 });
                      }}
                    />
                  </View>
                : null
              }
            </View>

            {/* BOARD SIDEBAR */}
            {!selectedDeck ? ( /* SHOW LIST OF DECKS */
              <View style={styles.sidebarContainer}>
                {/* HEADER */}
                <View style={styles.collectionHeader}>
                  <Text bold style={{ fontSize: 16, textAlign: 'center' }}>Choose a Deck</Text>
                </View>
                {/* LIST */}
                <View style={{ flex: 1, position: 'relative' }}>
                  {
                    user.adventureSession && user.adventureSession.gameID 
                    ? (
                      <View
                        style={{
                          ...globalStyles.absoluteCenter,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          zIndex: 100,
                          padding: 20
                        }}
                      >
                        <Text
                          bold
                          style={{
                            textAlign: 'center'
                          }}
                        >
                          You can not edit decks while in a battle. Finish your battle and then come back
                        </Text>
                      </View>
                    )
                    : null
                  }
                  <View style={{ flex: 1, overflow: 'visible' }}>
                    {
                      ["classic", "steampunk"].map((deckName, i) => {
                        const deck = this.props.user.configuredDecks[deckName];

                        return (
                          <TouchableHighlight
                            onPress={() => this.setDeck(deckName)}
                            activeOpacity={deck ? 1 : 0.85}
                            key={deckName}
                          >
                            <ImageBackground
                              style={{
                                ...styles.deckContainer,
                                opacity: deck ? 1 : 0.8,
                                backgroundColor: '#249bf8',
                                ...(
                                  tutorialPhase && tutorialPhase.step === 'INTRO_DECK_CHOOSE' && deckName === 'classic'
                                  ? {
                                      shadowColor: 'gold',
                                      shadowRadius: 8,
                                      shadowOpacity: 0.8,
                                      scale: 1.09,
                                      marginTop: 10
                                    }
                                  : {}
                                )
                              }}
                              source={require('../../assets/img/ui/backgrounds/bg.png')}
                              resizeMode='repeat'
                            >
                              <CardBack
                                faction={deckName}
                                style={{
                                  height: 52,
                                  width: 38
                                }}
                                imageStyle={{
                                  height: 52,
                                  width: 38,
                                  borderWidth: 1,
                                  borderRadius: 3
                                }}
                              />
                              <View style={styles.deckContent}>
                                <Text bold style={{ fontSize: 16 }}>{capitalize(deckName)} deck</Text>
                                {
                                  deck
                                    ? <Text style={{ fontSize: 14, color: deck.valid ? 'white' : 'red' }}>{this.totalDeckSize(deckName)}/{this.deckSizeLimit(deckName)}</Text>
                                    : <Text bold style={{ fontSize: 12 }}>
                                      0/50 {/* reach phase {i} in Adventure Mode to unlock */}
                                      </Text>
                                }
                              </View>
                            </ImageBackground>
                          </TouchableHighlight>
                        )
                      })
                    }
                  </View>
                </View>
              </View>
            )
            : ( /* SHOW CARDS IN DECK */
              <View style={{ width: styles.sidebarContainer.width }}>
                {/* HEADER */}
                <ImageBackground
                  style={styles.deckHeader}
                  source={images.cardCovers[selectedDeck]}
                  resizeMode='cover'
                >
                  <Text bold style={{ fontSize: 18, textAlign: 'right' }}>{capitalize(selectedDeck)} Deck</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: 'right',
                      color: collection.configuredDecks[selectedDeck].valid ? 'white' : 'red'
                    }}
                  >{this.totalDeckSize(selectedDeck)}/{this.deckSizeLimit(selectedDeck)}</Text>
                </ImageBackground>
                <Animated.View
                  style={{
                    ...styles.sidebarContainer,
                    flex: 1,
                    padding: 3,
                    borderColor: this.state.glowDropArea.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#4F4F4F', 'gold']
                    }),
                    scale: this.state.glowDropArea.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]
                    }),
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                    ref="dropAreaRef"
                    onLayout={(e) => {
                      this.refs.dropAreaRef.measure((x, y, width, height, pageX, pageY) => {
                        this.setState({
                          dropLayout: { pageX, height, width, pageY }
                        });
                      });
                    }}
                  >
                    <ScrollView
                      style={{ flex: 1 }}
                    >
                      {
                        this.cardsInDeck.map((card, i) =>
                          <TouchableHighlight
                            onPress={() => this.removeFromDeck(card.id)}
                            key={card.instanceID}
                          >
                            <View style={styles.deckCardContainer}>
                              <Image
                                source={images.cards[card.id]}
                                style={{
                                  width: 60,
                                  height: 60,
                                  position: 'absolute',
                                  right: 0
                                }}
                                resizeMode='cover'
                              />
                              <LinearGradient
                                colors={['#333','#4F4F4F', 'transparent']}
                                locations={[0, 0.75, 1]}
                                start={[0, 0.5]}
                                end={[1, 0.5]}
                                style={{
                                  flex: 1,
                                  padding: 8,
                                  marginRight: 18,
                                  justifyContent: 'center'
                                }}
                              >
                                <Text bold style={{ fontSize: 14 }}>
                                  {card.name} {card.quantity > 1 ? `(${card.quantity})` : null}
                                </Text>
                              </LinearGradient>
                            </View>
                          </TouchableHighlight>
                        )
                      }
                    </ScrollView>
                    <Button
                      title='Back'
                      onPress={() => this.setDeck(null)}
                      tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}
                    />
                  </View>
                </Animated.View>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  deckConfigurationView: {
    overflow: 'visible',
    flex: 1,
    backgroundColor: '#351818',
    marginLeft: 6,
    marginRight: 6,
    paddingTop: 58,
    alignItems: 'center'
  },
  headerContainer: {
    position: 'absolute',
    alignItems: 'stretch',
    top: 0,
    left: -6,
    right: -6,
    backgroundColor: 'rgba(79,79,79,0.75)',
    paddingBottom: 6,
    zIndex: 10
  },
  boardContainer: {
    maxWidth: 710,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    margin: 12,
    zIndex: 15
  },
  mainBoardContainer: {
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'stretch',
    borderRadius: 12,
    padding: 13,
    flex: 1,
    marginRight: 8,
    position: 'relative',
    zIndex: 10 // over the sidebar
  },
  mainBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    zIndex: 11, // hover over the page arrows
  },
  boardList: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: (4 * (cardStyles.cardContainer.width + 11)),
  },
  nextPageButtonContainer: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // hover over mainBoardContainer
  },
  quantityLabel: {
    ...globalStyles.cobbleBox,
    marginVertical: 3,
    borderWidth: 2,
    padding: 2,
    borderRadius: 3
  },

  // sidebar styles
  sidebarContainer: {
    width: 198,
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 6,
    borderColor: '#4F4F4F',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    position: 'relative'
  },
  collectionHeader: {
    backgroundColor: '#735720',
    borderBottomWidth: 6,
    borderColor: '#4F4F4F',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    padding: 6,
    borderRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  deckContainer: {
    position: 'relative',
    backgroundColor: '#BDBDBD',
    borderWidth: 5,
    borderColor: '#828282',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
    margin: 4,
    marginBottom: 0
  },
  deckContent: {
    flex: 1,
    alignSelf: 'stretch',
    marginLeft: 5,
    paddingTop: 4
  },
  deckHeader: {
    position: 'relative',
    borderWidth: 6,
    borderRadius: 8,
    borderColor: '#BDBDBD',
    marginBottom: 3,
    paddingVertical: 4,
    alignItems: 'flex-end',
    textAlign: 'right',
    backgroundColor: 'rgba(0,0,0,0.27)'
  },
  deckCardContainer: {
    position: 'relative',
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 4,
    backgroundColor: 'white',
    borderRadius: 3,
    alignItems: 'stretch',
    justifyContent: 'center',
    minHeight: 35,
    overflow: 'hidden'
  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps, null)(DeckConfiguration);

const GamemodeModal = ({ selectedDeck }) => (
  <CustomAlert
    title="Select Gamemode"
  >
    <Button
      title="Adventure Mode"
      style={{ marginBottom: 12 }}
      charged
      onPress={() => {
        socket.emit('adventure.new', selectedDeck, (err) => {
          if (err) Alert.alert(err);
          else {
            const revealSound = new Audio.Sound();
            revealSound.loadAsync(
              require('../../assets/audio/ui/revealDeck.mp3'),
              { shouldPlay: true }
            );
            store.dispatch({ type: 'SET_ALERT', payload: null });
            navigationService.navigate('AdventureMode');
          }
        });
      }}
    />
    <Button
      title="Multiplayer"
      style={{ marginBottom: 12 }}
      onPress={() => Alert.alert("GearCasters are still hard at training. Opening soon.")}
    />
    <Button
      title="Arena"
      onPress={() => Alert.alert("Arena is coming soon.")}
    />
  </CustomAlert>
)

const tutorialPhases = {
  INTRO_EXPLAIN: {
    step: 'INTRO_EXPLAIN',
    nextStep: 'INTRO_DECK_CHOOSE',
    dialogue: {
      text: 'Here you can view the entire collection you have earned in battle.',
      align: 'top'
    }
  },
  INTRO_DECK_CHOOSE: {
    step: 'INTRO_DECK_CHOOSE',
    dialogue: {
      text: "Choose the \"Classic\" deck to start configuring it!",
      align: "bottom"
    }
  },
  PENDING_INTRO_DRAG: {
    step: 'PENDING_INTRO_DRAG',
    dialogue: {
      text: "This is your deck configuration. You can configure your decks for strategic advantages in battle"
    },
    nextStep: 'INTRO_DRAG'
  },
  INTRO_DRAG: {
    step: 'INTRO_DRAG',
    dialogue: {
      text: "You can add cards from your collection by dragging them into the deck. Try it!"
    }
  },
  INTRO_REMOVE: {
    step: 'INTRO_REMOVE',
    dialogue: {
      text: "You can similarly return cards to your collection by tapping on them in the deck view."
    },
    nextStep: 'INTRO_DECK_LIMITS'
  },
  INTRO_DECK_LIMITS: {
    step: 'INTRO_DECK_LIMITS',
    dialogue: {
      text: "In order to head out into battle, your deck must have 30-50 cards in total."
    },
    nextStep: 'INTRO_PLAY'
  },
  INTRO_PLAY: {
    step: "INTRO_PLAY",
    dialogue: {
      text: "Once you feel your deck is ready, you can begin your adventure by clicking 'Resume'. Good luck!"
    },
    nextStep: null
  }
}