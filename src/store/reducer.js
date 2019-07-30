import initialState from "./initialState";

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PENDING_AUTH':
      return ({ ...state, pendingAuth: action.payload });
    case 'FONT_LOADED':
      console.info('font loaded');
      return ({ ...state, fontLoaded: true });
    case 'SET_CONNECTION':
      return ({ ...state, connection: action.payload });
    case 'SET_USER':
      return ({ ...state, user: action.payload });
    default:
      return state;
  }
}