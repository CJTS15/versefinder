/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from '@/components/ui/select';
import { toast, Toaster } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { ClipboardCopy, Search, Loader, Settings2 } from "lucide-react";

export default function Home() {

  const router = useRouter();
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  const [queryVerse, setQueryVerse] = useState('');
  const [verses, setVerses] = useState<any[]>([]);
  const [version, setVersion] = useState('kjv');
  
  const [bookList, setBookList] = useState<{ id: string; name: string}[]>([]);
  const [bookId, setBookId] = useState('');
  
  const [chapterList, setChapterList] = useState<number[]>([]);
  const [chapterNumber, setChapterNumber] = useState('1');

  const [verseList, setVerseList] = useState<number[]>([]);
  const [verseNumber, setVerseNumber] = useState('');
  const [startVerse, setStartVerse] = useState('1');
  const [endVerse, setEndVerse] = useState('1');
  const [rangeError, setRangeError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copyVerse, setCopyVerse] = useState<{ text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch book list when version changes
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

        // Optionally preselect the first book
        if(!bookId && books.length > 0) {
          setBookId(books[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch book ID:", err);
      }
    };

    fetchBookList();
  }, [version]);

  // Fetch chapter numbers when version and bookId change
  useEffect(() => {
    if (!version || !bookId) return;

    const fetchChapterNumbers = async () => {
      try {
        const res = await fetch(`https://bible-api.com/data/${version}/${bookId}`);
        const data = await res.json();

        // Generate a list of chapter numbers from data
        const chapters = data.chapters.map((_: any, index: number) => index + 1);
        setChapterList(chapters);

        // Optionally preselect chapter 1
        if (!chapterNumber) {
          setChapterNumber('1');
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
      }
    };
    fetchChapterNumbers();
  }, [version, bookId]);

  // Fetch verse numbers when version, bookId, and chapterNumber change
  useEffect(() => {
  if (!version || !bookId || !chapterNumber) return;

    const fetchVerseNumbers = async () => {
      try {
        const res = await fetch(`https://bible-api.com/data/${version}/${bookId}/${chapterNumber}`);
        const data = await res.json();

        // Generate a list of verse numbers from data
        const verses = data.verses.map((_: any, index: number) => index + 1);
        setVerseList(verses);

        // Optionally preselect verse 1
        if (!startVerse) setStartVerse('1');
        if (!endVerse) setEndVerse('1');
      } catch (err) {
        console.error('Error fetching verses:', err);
      }
    };

    fetchVerseNumbers();
  }, [version, bookId, chapterNumber]);

  // Validate verse range when startVerse or endVerse changes
  useEffect(() => {
    const start = parseInt(startVerse, 10);
    const end = parseInt(endVerse, 10);

    if (!startVerse || !endVerse) {
      setRangeError('Both start and end verses are required.');
    } else if (isNaN(start) || isNaN(end)) {
      setRangeError('Verse inputs must be numbers.');
    } else if (start < 1 || end > verseList.length) {
      setRangeError(`Range must be between 1 and ${verseList.length}.`);
    } else if (start > end) {
      setRangeError('Start verse cannot be greater than end verse.');
    } else {
      setRangeError('');
    }
  }, [startVerse, endVerse, verseList]);

  // Function to fetch verses based on selected book, chapter, and verse
  const getVerse = async () => {

    if (!version || !bookId || !chapterNumber || !startVerse || !endVerse ) return;
    setLoading(true);
    
    try {
      const verseReference = `${bookId} ${chapterNumber}:${startVerse}-${endVerse}`;

      const query = encodeURIComponent(verseReference);
      const res = await fetch(`https://bible-api.com/${query}?version=${version}?single_chapter_book_matching=indifferent`);
      const data = await res.json();
      
      if (data.verses) {
      setVerses(data.verses);
    } else {
      setVerses([]);
      console.warn("No verses found in response.");
    }
 
    } catch (error) {
      setVerses([]);
      console.error('Error fetching verses. Please try again.');
    } finally {
      setLoading(false);
      setOpen(false)
    }
  };

  // Function to search for verses based on query
  const searchVerse = async () => {

    if (!queryVerse || !version) return;
   
    setFetchError(false);
    setLoading(true);
    try {
      const res = await fetch(`https://bible-api.com/${queryVerse}?version=${version}?single_chapter_book_matching=indifferent`);
      const data = await res.json();

      if(!data || data.error) {
        setFetchError(true);
        setVerses([]);
      } else {
        setVerses(data.verses);
      }
      setQueryVerse('');
    } catch (error) {
      setFetchError(true);
      console.error('Error fetching verses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle copying selected verses to clipboard
  const handleCopy = () => {

    if (!selectedVerses.length) return; 
  
    const selectedTexts = verses
      .filter((v) => selectedVerses.includes(v.verse))
      .map((v) => `${v.book_name} ${v.chapter}:${v.verse} - ${v.text.replace(/\n/g, " ").trim()}`)
      .join("\n");

    navigator.clipboard.writeText(selectedTexts)
      .then(() => {
        toast("Verse copied!", {
          description: "You can now paste verse anywhere.",
          action: {
            label: "Undo",
            onClick: () => {
              navigator.clipboard.writeText(copyVerse?.text || "");
              toast("Verse remove from clipboard!");
            },
          },
        });
        //setDrawerOpen(false);
        setTimeout(() => setCopied(false), 500);
      })
      .catch((err) => {
        toast.error("Failed to copy verse.");
        console.error("Clipboard error:", err);
      });
  };

  // Function to toggle verse selection
  // This function adds or removes the verse number from the selectedVerses array
  const toggleVerse = (verseNumber: number) => {

    setSelectedVerses((prev) =>
      prev.includes(verseNumber)
        ? prev.filter((v) => v !== verseNumber)
        : [...prev, verseNumber]
    );
  };

  // Function to parse verse reference from input
  const parseVerseReference = (input: string) => {

    const regex = /^([\w\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/i;
    const match = input.trim().match(regex);

    if (!match) return; {
      const [, bookNameInput, chapterStr, verseStartStr, verseEndStr] = match;

      const bookFound = bookList.find(
        (b) => b.name.toLowerCase() === bookNameInput.toLowerCase().trim()
      );

      if (bookFound) {
        setBookId(bookFound.id);
      }

      setChapterNumber(chapterStr);
      //setVerseNumber(verseStartStr);
      setStartVerse(verseStartStr);
      setEndVerse(verseEndStr);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-start p-4 bg-gray-100">

      <header className="flex justify-between w-full max-w-2xl py-4 mx-auto">
        <div className="flex justify-between w-full gap-2">
          <div className="flex-row select-none">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/")}>
              Verse<span className="text-amber-500">Finder</span>
              <sup className="text-xs text-gray-500 ml-1">v1</sup>
            </h1>
            <p className="text-sm">
              Find your favorite Bible verses easily.
            </p>
          </div>
          
          <div className="flex">
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Versions" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Versions</SelectLabel>
                  <SelectItem value="asv">ASV</SelectItem>
                  <SelectItem value="bbe">BBE</SelectItem>
                  <SelectItem value="kjv">KJV</SelectItem>
                  <SelectItem value="web">WEB</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>           
          </div>
          
        </div>  
    </header>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-4"
      >
        
        <div className="grid grid-flow-col grid-cols-4 gap-2 mt-4">
          
          <Input
            className="w-full col-span-4"
            value={queryVerse}
            onChange={(e) => {
              const input = e.target.value;
              setQueryVerse(input);
              setUserIsTyping(true);

              if (typingTimeout) 
                clearTimeout(typingTimeout);
              
              const timeout = setTimeout(() => {
                setUserIsTyping(false);
                parseVerseReference(input);
              }, 8000); // Adjust delay as needed
              
              setTypingTimeout(timeout);
            }}
            placeholder="Find a verse e.g John 3:16"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={searchVerse} disabled={loading} className="bg-amber-500 hover:bg-amber-600 w-full cols-span-2">
                  {loading ? <Loader className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>
          </TooltipProvider> 

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger><Settings2 className="w-4 h-4" /></PopoverTrigger>
            <PopoverContent>
              <div className="grid grid-flow-row-dense grid-rows-3 gap-2">

                <Combobox bookId={bookId} setBookId={setBookId} />

                <Select value={chapterNumber} onValueChange={setChapterNumber} >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Chapters</SelectLabel>
                      {chapterList.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="1"
                    value={startVerse}
                    onChange={(e) => setStartVerse(e.target.value)}
                    min={1}
                    max={verseList.length}
                    className={rangeError ? 'border-red-500' : ''}
                  />
                  <Input
                    type="number"
                    placeholder="1"
                    value={endVerse}
                    onChange={(e) => setEndVerse(e.target.value)}
                    min={1}
                    max={verseList.length}
                    className={rangeError ? 'border-red-500' : ''}
                  />
                </div>

                <Button
                    variant="ghost"
                    className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setBookId('GEN');
                      setChapterNumber('1');
                      setStartVerse('1');
                      setEndVerse('1');
                    }}
                  >
                    Clear Selection
                  </Button>

                <Button onClick={getVerse} disabled={loading || !!rangeError} className="bg-amber-500 hover:bg-amber-600 w-full">
                  {loading ? <Loader className="w-4 h-4" /> : 'Get Verse'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

          {fetchError && !loading && (
            <div className="w-full p-6 justify-center text-center">
                <div className="text-sm text-red-500 mt-2">
                  Oops! Sorry, no verse found.
                </div>
            </div>
          )}

        {verses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="py-4 text-xl font-semibold">
                {verses[0].book_name} {verses[0].chapter}:
                {verses.length === 1
                  ? verses[0].verse
                  : `${verses[0].verse}-${verses[verses.length - 1].verse}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {verses.map((v) => {
                const verseKey = `${v.book_name} ${v.chapter}-${v.verse}`;
                const isSelected = selectedVerses.includes(v.verse);

                return (
                  <div
                    key={verseKey}
                    onClick={() => toggleVerse(v.verse)}
                    className={`group relative cursor-pointer rounded-md px-4 py-2 transition-all ${
                      isSelected ? "bg-amber-100" : "hover:bg-gray-100"
                    }`}
                  >
                    <sup className="text-xs text-gray-500 mr-2">{v.verse}</sup>
                    <span className="text-l text-gray-800 leading-relaxed">{v.text.replace(/\n/g, ' ').trim()}</span>

                  </div>
                );
              })}
            </CardContent>
            
            {selectedVerses.length > 0 && (
            <CardFooter className="flex justify-end mt-4 transition">
              <Toaster position="bottom-right" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="bg-amber-500 hover:bg-amber-600 fixed bottom-4 right-4 z-50" onClick={() => handleCopy()}><ClipboardCopy className=" w-4 h-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
                </Tooltip>
                </TooltipProvider> 
            </CardFooter>
          )}
          </Card>
          
        )}   
      </motion.div>
    </section>
  );
}
