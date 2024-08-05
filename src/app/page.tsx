"use client";

import React, { useState, KeyboardEvent, useEffect } from "react";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewItemName] = useState("");
  const [newQuantity, setNewItemQuantity] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    setInventory(items);
  };

  const addItem = async () => {
    if (newName.trim() === "") return;
    setIsLoading(true);
    
    const existingItem = inventory.find(item => item.name.toLowerCase() === newName.toLowerCase());
    
    try {
      if (existingItem) {
        // If item exists, update quantity
        await updateDoc(doc(db, "inventory", existingItem.id), {
          quantity: existingItem.quantity + newQuantity
        });
        toast.success(`${existingItem.name} quantity increased by ${newQuantity}`);
      } else {
        // If item doesn't exist, add new item
        await addDoc(collection(db, "inventory"), {
          name: newName,
          quantity: newQuantity
        });
        toast.success(`${newName} added to inventory`);
      }

      setNewItemName("");
      setNewItemQuantity(1);
      await fetchInventory();
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        await deleteDoc(doc(db, "inventory", id));
        toast.success("Item removed from inventory");
      } else {
        // Update quantity if it's greater than 0
        await updateDoc(doc(db, "inventory", id), { quantity: newQuantity });
        toast.success("Item quantity updated");
      }
      await fetchInventory();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventory", id));
      await fetchInventory();
      toast.success("Item removed from inventory");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const handleSearch = async (input: string) => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const itemsForSearch: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      itemsForSearch.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });

    setInventory(itemsForSearch.filter((el) => el.name.toLowerCase().includes(input.toLowerCase())));
  }

  return (
    <main className="flex min-h-screen flex-col items-center md:pt-24 md:px-6 pt-24 px-4">

      <h1 className="text-4xl font-bold mb-8">Pantry Tracker</h1>

      <div className="w-full max-w-md mb-8">
        <div className="flex mb-2">
          <Input 
            type="text"
            value={newName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter name of the item"
            className='flex-grow p-2 mr-2 border rounded'
          />
          <Input 
            type="number"
            value={newQuantity}
            onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
            onKeyPress={handleKeyPress}
            min='1'
            className='w-16 p-2 border rounded'
          />
        </div>
        <Button
          onClick={addItem}
          className="w-full p-2 bg-primary rounded text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding item...
            </>
          ) : (
            "Add Item"
          )}
        </Button>
      </div>

      <Input
          type="search"
          placeholder='Search items...'
          className='w-full max-w-md mb-4'
          onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="w-full max-w-md rounded-md bg-slate-100 dark:bg-accent p-4 h-[calc(100vh-400px)] overflow-y-auto">
        <ul className="space-y-4">
          {inventory.map((item) => (
            <Card key={item.id} className="flex flex-col sm:flex-row justify-between items-center p-4">
              <span className="mb-2 sm:mb-0">{item.name}: {item.quantity}</span>
              <div className="flex flex-wrap justify-center sm:justify-end">
                <Button
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="mr-2 mb-2 sm:mb-0 text-white"
                  size="sm"
                >
                  +
                </Button>
                <Button
                  onClick={() => updateItem(item.id, Math.max(0, item.quantity - 1))}
                  className="mr-2 mb-2 sm:mb-0 text-white"
                  size="sm"
                >
                  -
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteItem(item.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      </div>

    </main>
  );
}
