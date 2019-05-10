function swap(A, i, j) {
  let temp = A[i];
  A[i] = A[j];
  A[j] = temp;
}


function shiftDown(A, i, length, key) {
  let temp = A[i][key];
  for(let j = 2*i+1; j<length; j = 2*j+1) {
    temp = A[i][key];
    if(j+1 < length && A[j][key] < A[j+1][key]) {
      j++;
    }
    if(temp < A[j][key]) {
      swap(A, i, j)
      i = j;
    } else {
      break;
    }
  }
}

module.exports = function heapSort(A, key) {
  for(let i = Math.floor(A.length/2-1); i>=0; i--) {
    shiftDown(A, i, A.length, key);
  }
  for(let i = Math.floor(A.length-1); i>0; i--) {
    swap(A, 0, i);
    shiftDown(A, 0, i, key);
  }
}


const arr = [
  {count: 142},
  {count: 11},
  {count: 14},
  {count: 41},
  {count: 11},
  {count: 123},
  {count: 11},
]

