<?php

/**
 * Description of DmParser
 *
 * @author molinspa
 */
class DmParser
{
    private $sSelectedContent;
    private $whitespace = array(' ', "\t", "\r", "\n");
    private $nonAtom = array('(', ')', ' ', "\t", "\r", "\n", '"');
    
    public function __construct($sFileRealPath, $sStrStart, $sStrEnd)
    {
        $sFullContent = Filesystem::get($sFileRealPath);
        $this->sSelectedContent = Str::getStringBetween($sFullContent, $sStrStart, $sStrEnd);
    }
    
    public function run($bRemoveComment = true)
    {
        $sCurrentLine = '';
        $aInstructionList = array();
        foreach(preg_split("/((\r?\n)|(\r\n?))/", $this->sSelectedContent) as $line)
        {
            if(empty($line) || !Arr::in($this->nonAtom, substr($line, 0, 1)))
            {
                continue;
            }
            else if($bRemoveComment && strpos($line, ';') !== false)
            {
                $sCurrentLine .= strstr($line, ';', true);
                
                if(empty($sCurrentLine))
                {
                    continue;
                }
            }
            else
            {
                $sCurrentLine .= $line;
            }
            
            if(substr_count($sCurrentLine, '(') !== substr_count($sCurrentLine, ')'))
            {
                continue;
            }
            
            try
            {
//                Util::var_dump($this->tokenize(trim($sCurrentLine))); echo '<br /><br />';
                $aResult = $this->parse($this->tokenize(trim($sCurrentLine)));
                $aInstructionList[] = (count($aResult) === 1) ? Arr::first($aResult) : $aResult;
            }
            catch(Exception $e)
            {
                echo 'Exception for : ' . '<br />';
                Util::var_dump($sCurrentLine);
            }
            
            $sCurrentLine = '';
        }
        
        return $aInstructionList;
    }

    private function tokenize($code)
    {
        $tokens = array();
        $bQuoteCapture = false;
        for ($i = 0, $length = strlen($code); $i < $length; $i++) {
            $char = $code[$i];
            
            // quote token (just the quote character)
            if ($char === '"' && (($length > $i+1) ? $code[$i+1] : null) === '"') {
                $tokens[] = '"';
                $i++;
                $tokens[] = '"';
                continue;
            }
            
            // quoted values are single tokens
            if ($char === '"') {
                $bQuoteCapture = !$bQuoteCapture;
//                $tokens[] = $char;
                continue;
            }
            
            // kill whitespace
            if (in_array($char, $this->whitespace) && !$bQuoteCapture) {
                continue;
            }

            // parentheses are single tokens
            if (in_array($char, array('(', ')'))) {
                $tokens[] = $char;
                continue;
            }
            
            // quote token (just the quote character)
//            if ("'" === $char) {
//                $tokens[] = $char;
//                continue;
//            }

            // atom token
            $atom = '';
            $next = $char;
            do {
                $atom .= $next;
                $next = ($length > $i+1) ? $code[$i+1] : null;
            } while (null !== $next 
                    && (!in_array($next, $this->nonAtom) 
                        || ($bQuoteCapture && in_array($next, $this->whitespace))) 
                    && ++$i);
            $tokens[] = $atom;
        }
        
        return $tokens;
    }
    
    private function parse(array $tokens)
    {
        $ast = array();

        for ($i = 0, $length = count($tokens); $i < $length; $i++) {
            $token = $tokens[$i];

            // wrap quoted value
            if ('"' === $token) {
                list($parsedToken, $i) = $this->parseQuotedToken($tokens, $i);
                $ast[] = $parsedToken;
                continue;
            }

            // extract atoms
            if (!in_array($token, array('(', ')'))) {
                $ast[] = $this->normalizeAtom($token);
                continue;
            }

            // parse list recursively
            if ('(' === $token) {
                list($listTokens, $i) = $this->extractListTokens($tokens, $i);
                if(is_array($listTokens))
                {
                    $ast[] = $this->parse($listTokens);
                }
                else
                {
                    echo 'Not an array : ' . '<br />';
                    Util::var_dump($listTokens);
                }
                continue;
            }
        }
//        print_r($ast);
        return $ast;
    }

    private function parseQuotedToken(array $tokens, $i)
    {
        // skip past quote char
        $i++;
        
        // quoted atom
        if ('(' !== $tokens[$i]) {
            $atom = $this->normalizeAtom($tokens[$i]);
            return array(
                $atom,
                $i,
            );
        }

        // quoted list
        list($listTokens, $i) = $this->extractListTokens($tokens, $i);
        $list = $this->parse($listTokens);
        
        return array(
            $list,
            $i,
        );
    }

    private function normalizeAtom($atom)
    {
        if (is_numeric($atom))
        {
            return (int) $atom;
        }
        else if($atom === '"')
        {
            return '';
        }
//        else if((substr($atom, 0, 1) !== '"' || strlen($atom) === 1)
//            && substr($atom, -1) === '"')
//        {
//            return substr($atom, 0, strlen($atom) - 1);
//        }

        return $atom;
    }

    private function extractListTokens(array $tokens, $i)
    {
        $level = 0;
        $init = $i;

        for ($length = count($tokens); $i < $length; $i++) {
            $token = $tokens[$i];

            if ('(' === $token) {
                $level++;
            }

            if (')' === $token) {
                $level--;
            }

            if (0 === $level) {
                return array(
                    array_slice($tokens, $init + 1, $i - ($init + 1)),
                    $i,
                );
            }
        }
    }
}