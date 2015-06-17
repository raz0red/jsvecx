// tojsstring.cpp : Defines the entry point for the console application.
//

#include <stdio.h>
#include <stdlib.h>

int main(int argc, char* argv[])
{
  if( argc < 3 )
  {
    printf( "usage: <prefix> <binary file>" );
    exit(1);
  }

  FILE *fp = fopen( argv[2], "rb" );   

  if( !fp )
  {
    printf( "Unable to open file!" );
    exit(1);
  }
  
  int c;
  
  printf( argv[1] );
  printf( "='" );
  while( ( c = fgetc( fp ) ) != EOF)
  {
      printf( "\\x%.2x", c );
  }
  printf( "';" );
  
  fclose( fp );
  return 0;
}

