import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Checkout() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/"); }, []);
  return null;
}
