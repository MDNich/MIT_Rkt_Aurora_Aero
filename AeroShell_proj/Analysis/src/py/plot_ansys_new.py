#!/usr/bin/python3



import random
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from matplotlib import backends
from matplotlib.backends import backend_pdf
from matplotlib import rcParams
from matplotlib import colors
import scipy.special as spsp
import math
import scipy.optimize as spopt
matplotlib.rcParams.update(matplotlib.rcParamsDefault)
rcParams['text.usetex'] = True
rcParams['font.family'] = 'serif'
rcParams['font.sans-serif'] = ['CMU Serif']
rcParams['font.serif'] = ['CMU Serif']
plt.rc('text.latex', preamble=r'\usepackage{amsmath}\usepackage{amssymb}')



path = "../../dat/ansys/new.csv"
raw = np.loadtxt(path,dtype='str',delimiter=',')
print(raw[0])
rawT = np.transpose(raw)


fig = plt.figure(figsize=(20, 6))
ax = fig.add_subplot(projection='3d')
x = np.array(rawT[1][1:],dtype='float')
y = np.array(rawT[2][1:],dtype='float')
z = np.array(rawT[3][1:],dtype='float')
pTot = np.array(rawT[8][1:],dtype='float')
factor = np.max(pTot)/np.max(z)
ax.scatter3D(x,y,z*factor,alpha=0.3,c=pTot,cmap='jet')
plt.show()


