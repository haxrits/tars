"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export default function SyncUser() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (!user) return;

    createUser({
      clerkId: user.id,
      name: user.fullName ?? "",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl ?? "",
    });
  }, [user, createUser]);

  return null;
}