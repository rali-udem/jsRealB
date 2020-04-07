// adapted in javascript from Python from https://github.com/vikasnar/Bleu

function count_ngram(candidate, references, n){
    var clipped_count = 0
    var count = 0
    var r = 0
    var c = 0
    // console.log("refs",references)
    // console.log("candidate",candidate)
    for (var si=0;si<candidate.length;si++){
        // Calculate precision for each sentence
        var ref_counts = []
        var ref_lengths = []
        // Build dictionary of ngram counts
        for (var ir=0;ir<references.length; ir++){
            var reference = references[ir];
            var ref_sentence = reference[si]
            var ngram_d = {}
            var words = ref_sentence.trim().split(/\s+/)
            ref_lengths.push(words.length)
            var limits = words.length - n + 1
            // loop through the sentence consider the ngram length
            for (var i=0;i<limits;i++){
                ngram = words.slice(i,i+n).join(' ').toLowerCase()
                if (ngram=='')continue;
                if (ngram in ngram_d)
                    ngram_d[ngram] += 1
                else
                    ngram_d[ngram] = 1
            }
            ref_counts.push(ngram_d)
        }
        // candidate
        var cand_sentence = candidate[si];
        var cand_dict = {}
        words = cand_sentence.trim().split(/\s+/)
        limits = words.length - n + 1
        for (var i=0;i<limits;i++){
            var ngram = words.slice(i,i + n).join(' ').toLowerCase();
            if (ngram in cand_dict)
                cand_dict[ngram] += 1
            else
                cand_dict[ngram] = 1
        }
        clipped_count += clip_count(cand_dict, ref_counts)
        count += limits
        r += best_length_match(ref_lengths, words.length)
        c += words.length
    }
    if (clipped_count == 0)
        pr = 0
    else
        pr = 1.0*clipped_count / count;
    var bp = brevity_penalty(c, r)
    return [pr, bp]
}

function clip_count(cand_d, ref_ds){
    //"""Count the clip count for each ngram considering all references"""
    var count = 0
    for (var m in cand_d){
        m_w = cand_d[m]
        m_max = 0
        for (var i=0;i<ref_ds.length;i++){
            ref=ref_ds[i]
            if (m in ref)
                m_max = Math.max(m_max, ref[m])
        }
        m_w = Math.min(m_w, m_max)
        count += m_w
    }
    return count
}

function best_length_match(ref_l, cand_l){
    // """Find the closest length of reference to that of candidate"""
    var least_diff = Math.abs(cand_l-ref_l[0])
    var best = ref_l[0]
    for (var i=0;i<ref_l.length;i++){
        ref =ref_l[i]
        if (Math.abs(cand_l-ref) < least_diff){
            least_diff = Math.abs(cand_l-ref)
            best = ref
        }
    }
    return best
}

function brevity_penalty(c, r){
    if (c > r)
        bp = 1
    else
        bp = Math.exp(1-(1.0*r)/c)
    return bp
}

function geometric_mean(precisions){
    return precisions.reduce((a,b)=>a*b) ** (1.0 / precisions.length)
}

function bleu(candidate, references){
    var precisions = []
    for (var i=0;i<4;i++){
        pr_bp = count_ngram(candidate, references, i+1)
        precisions.push(pr_bp[0])
    }
    var bleu = geometric_mean(precisions) * pr_bp[1];
    return bleu
}


if (typeof module !== 'undefined' && module.exports) {
    var candidate=[];
    var references=[];
    candidate[0]="It is a guide to action which ensures that the military always obeys the commands of the party.";
    references.push(["It is a guide to action that ensures that the military will forever heed Party commands."]);
    references.push(["It is the guiding principle which guarantees the military forces always being under the command of the Party."]);
    references.push(["It is the practical guide for the army always to heed the directions of the party."]);
    console.log("BLEU:%d",bleu(candidate,references));
    
var refs="By the riverside and near Café Sicilia is Bibimbap House.\n"+
"Bibimbap House is near Café Sicilia. It is located on the riverside.\n"+
"By the riverside, close to Café Sicilia, a Bibimbap House can be found.\n"+
"Bibimbap House can be found in the riverside area near Café Sicilia.\n"+
"Bibimbap House is in the area of riverside, near Café Sicilia.\n"+
"Bibimbap House can be found near Café Sicilia in the riverside area.\n"+
"Check out the Bibimbap House in the Riverside area, located near Café Sicilia.\n"+
"In the riverside area there is a restaurant called Bibimbap House. It located near Café Sicilia.\n"+
"Come visit Bibimbap House in the riverside area near Café Sicilia.\n"+
"Along the riverside and near Café Sicilia sits Bibimbap House.\n"+
"Bibimbap House is located near Café Sicilia along the riverside.\n"+
"There is a place called Bibimbap House in riverside. It is near the Café Sicilia."
    candidate=["Bibimbap House is an establishment near Café Sicilia on the riverside."];
    var refs1=refs.split("\n");
    references=[];
    for(var i=0;i<refs1.length;i++)
        references.push([refs1[i]]);
    console.log("BLEU:%d",bleu(candidate,references));
}
