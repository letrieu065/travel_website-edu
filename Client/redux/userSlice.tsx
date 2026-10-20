import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    [key: string]: any;
}

interface UserState {
    profile: UserProfile | null;
    isAuthenticated: boolean;
}

const initialState: UserState = {
    profile: null,
    isAuthenticated: false,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload;
            state.isAuthenticated = true;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;