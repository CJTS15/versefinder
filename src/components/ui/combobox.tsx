/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { useEffect, useState } from "react";

interface ComboboxProps {
  bookId: string;
  setBookId: (id: string) => void;
}

export function Combobox({ bookId, setBookId }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [version, setVersion] = useState('kjv');
  const [bookList, setBookList] = useState<{ id: string; name: string}[]>([]);
  
  useEffect(() => {
    if (!version) return;

    const fetchBookList = async () => {
      
      try {
        const res = await fetch(`https://bible-api.com/data/${version}`);
        const data = await res.json();

        // Generate a list of books from data
        const books = data.books.map((book: { id: string; name: string }) => ({
          id: book.id,
          name: book.name,
        }));
        
        setBookList(books);

      } catch (err) {
        console.error("Failed to fetch book ID:", err);
      }
    };

    fetchBookList();
  }, [version]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {bookList.find((book) => book.id === bookId)?.name ?? "..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search Book..." />
          <CommandList>
            <CommandEmpty>No book found.</CommandEmpty>
            <CommandGroup>
              {bookList.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.id}
                  onSelect={() => {
                    setBookId(book.id);
                    setOpen(false);
                  }}
                >
                  {book.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      bookId === book.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    
  )
}
