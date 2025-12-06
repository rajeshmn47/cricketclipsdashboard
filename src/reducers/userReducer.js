import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  CLEAR_ERRORS,
  LOGOUT_SUCCESS
} from '../constants/userConstants';

const initialState = {
  loading: false,
  user: null,
  error: null,
};

export const userLoginReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    case LOGIN_SUCCESS:
      return { ...state, loading: false, user: action.payload, error: null };
    case LOGIN_FAIL:
      return { ...state, loading: false, user: null, error: action.payload };
    case LOGOUT_SUCCESS:
      return { ...state, loading: false, user: null, error: null };
    case CLEAR_ERRORS:
      return { ...state, error: null };
    default:
      return state;
  }
};

export const userLoadReducer = (state = initialState, action) => {
  console.log(action, 'user load reducer action');
  switch (action.type) {
    case LOAD_USER_REQUEST:
      return { ...state, loading: true, error: null };
    case LOAD_USER_SUCCESS:
      return { ...state, loading: false, user: action.payload, error: null };
    case LOAD_USER_FAIL:
      return { ...state, loading: false, user: null, error: action.payload };
    case CLEAR_ERRORS:
      return { ...state, error: null };
    default:
      return state;
  }
};
