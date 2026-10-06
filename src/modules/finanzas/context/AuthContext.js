import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import {
  getUserRole,
  hasPermission,
  getRolePermissions,
  canAccessRoute,
  ROLES,
  loadRolePermissionsFromFirestore,
} from "../services/roleService";
import useAuthStore from "../../../store/authStore";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a Finanzas AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [userRole, setUserRoleState] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const authStoreUser = useAuthStore((state) => state.currentUser);
  const authStoreRole = useAuthStore((state) => state.userRole);

  const loadUserRole = async (userId) => {
    if (!userId) {
      setUserRoleState(null);
      return;
    }
    setRoleLoading(true);
    try {
      if (authStoreRole === 'admin') {
        setUserRoleState(ROLES.ADMIN);
        return;
      }
      const role = await getUserRole(userId);
      await loadRolePermissionsFromFirestore();
      setUserRoleState(role || ROLES.ADMIN);
    } catch (error) {
      console.error("Error loading user role in Finanzas AuthProvider:", error);
      setUserRoleState(ROLES.ADMIN);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        loadUserRole(firebaseUser.uid);
      } else {
        setUserRoleState(null);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRoleState(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error("No hay un usuario autenticado");
    }
    if (currentPassword) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }
    await firebaseUpdatePassword(currentUser, newPassword);
    return { success: true };
  };

  const checkPermission = (permission) => {
    if (userRole === ROLES.ADMIN || userRole === ROLES.ADMINISTRATIVO || authStoreRole === 'admin') {
      return true;
    }
    return hasPermission(userRole, permission);
  };

  const getUserPermissions = () => {
    return getRolePermissions(userRole || ROLES.ADMIN);
  };

  const canUserAccessRoute = (routePath) => {
    if (userRole === ROLES.ADMIN || authStoreRole === 'admin') {
      return true;
    }
    return canAccessRoute(userRole, routePath);
  };

  const value = {
    user: user || authStoreUser,
    userRole: userRole || authStoreRole || ROLES.ADMIN,
    roleLoading,
    loading,
    logout,
    updatePassword,
    checkPermission,
    getUserPermissions,
    canUserAccessRoute,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

