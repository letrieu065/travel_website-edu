import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
    id: string;
    fullName?: string;
    full_name?: string;
    name?: string;
    email: string;
    avatar?: string | null;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    phone_number?: string | null;
    phoneNumber?: string | null;
    role?: string | null;
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
